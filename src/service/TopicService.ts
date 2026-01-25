import cache_query from "../module/mysql_cache";
import query from "../module/mysql_query";
import { Request } from "express";
import HttpError from "../module/util/HttpError";
import { error, ok } from "../module/constants/state";

class TopicService {
    async getTopicList(page: number, limit: number, isAdmin: boolean, userId?: string) {
        // userId provided -> get my topics
        // userId not provided -> get all topics
        const offset = page * limit;
        if (userId) {
            const [_discuss_list, _tot] = await Promise.all([
                cache_query(`select title,create_time,edit_time,article_id from article where user_id = ? or article_id in
             (select article_id from article_content where user_id = ?)
        order by last_post desc,edit_time desc,create_time desc,article_id desc
        limit ?,?`, [userId, userId, offset, limit]),
                cache_query(`select count(1) as cnt from article
             ${isAdmin ? "" : "where defunct = 'N'"}`)
            ]);
            return {
                discuss: _discuss_list,
                total: _tot[0].cnt
            };
        } else {
            const [_discuss_list, _tot] = await Promise.all([
                cache_query(`select user_id, title, last_post, edit_time, create_time, article_id from article ${isAdmin ? "" : "where defunct = 'N'"}
        order by last_post desc,edit_time desc,create_time desc,article_id desc
        limit ?,?`, [offset, limit]),
                cache_query(`select count(1) as cnt from article 
        ${isAdmin ? "" : "where defunct = 'N'"}`)
            ]);
            return {
                discuss: _discuss_list,
                total: _tot[0].cnt
            };
        }
    }

    async getTopicDetail(topicId: number, page: number, limit: number, userId: string, isAdmin: boolean) {
        const offset = page * limit;
        const [discuss_content, _tot, _article] = await Promise.all([
            cache_query(`select * from 
            (select t.*,users.avatar,users.avatarUrl,users.nick,users.email from (select * from article_content where article_id = ?)t left join users
        on users.user_id = t.user_id)joint
         order by comment_id asc 
        limit ?,?`, [topicId, offset, limit]),
            cache_query("select count(1) as cnt from article_content where article_id = ?", [topicId]),
            cache_query(`select tmp.*,users.avatar,users.avatarUrl,users.nick,users.biography,users.solved,users.email from (
            select * from article where article_id = ?)
            tmp
            left join users on users.user_id = tmp.user_id
            `, [topicId])
        ]);

        if (!_article || _article.length === 0) {
            throw new HttpError("Topic not found", 404);
        }

        return {
            discuss: discuss_content,
            total: _tot[0].cnt,
            discuss_header_content: _article[0],
            owner: userId,
            admin: isAdmin
        };
    }

    async addReply(topicId: number, userId: string, content: string) {
        await query(`insert into article_content(user_id,content,article_id)
        values(?,?,?)`, [userId, content, topicId]);
        return ok.serverReceived;
    }

    async addNewPost(userId: string, title: string, content: string) {
        const rows = await query("insert into article(user_id,title,content)values(?,?,?)", [userId, title, content]);
        return rows.insertId;
    }

    async updatePost(topicId: number, userId: string, title: string, content: string) {
        await query("update article set title = ? , content = ?,edit_time = NOW(),last_post = NOW() where article_id = ? and user_id = ?",
            [title, content, topicId, userId]);
    }

    async getPostContent(topicId: number) {
        const _main_content = await query(`select content,title from article 
        where article_id = ?`, [topicId]);
        if (_main_content && _main_content.length > 0) {
            return _main_content[0];
        } else {
            throw new HttpError("Post not found", 404);
        }
    }

    async updateReply(topicId: number, commentId: number, userId: string, content: string) {
        await query(`update article_content set content = ? 
        where article_id = ? and comment_id = ? and user_id = ?`, [content, topicId, commentId, userId]);
    }

    async getReplyContent(topicId: number, commentId: number) {
        const _reply_content = await query(`select content from article_content 
        where article_id = ? and comment_id = ?`, [topicId, commentId]);
        if (_reply_content && _reply_content.length > 0) {
            return _reply_content[0];
        } else {
            throw new HttpError("Reply not found", 404);
        }
    }

    async blockReply(topicId: number, commentId: number) {
        await query(`update article_content set content = "该回复经管理员审核，已被屏蔽" where article_id = ? and
         comment_id = ?`, [topicId, commentId]);
    }

    async searchTopics(searchVal: string, page: number, limit: number) {
        const offset = page * limit;
        const val = `%${searchVal}%`;
        let sql = "select * from article where title like ?";
        let sqlArr: (string | number)[] = [val];

        // This logic mimics the original code: 
        // if (search_val.length === 2 || typeof req.params.search_val === "undefined")
        // "%" length is 1, "%%" length is 2. So if empty search -> length is 2.
        if (val.length === 2) {
            sql = `select * from article 
            order by last_post desc,edit_time desc,create_time desc,article_id desc`;
            sqlArr = [];
        }

        // Add limit
        sql += " limit ?,?";
        sqlArr.push(offset, limit);

        return await query(sql, sqlArr);
    }
}

export default new TopicService();
