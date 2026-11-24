/** 讨论区/专题题目 SQL（从 application/services/TopicService 逐字搬来）。 */
import cache_query from "../../db/legacy/mysql_cache";
import query from "../../db/legacy/mysql_query";
import { TopicRepository } from "../../../application/ports/TopicRepository";

export class MySqlTopicRepository implements TopicRepository {
    findUserTopics(userId: string, offset: number, limit: number) {
        return cache_query(`select title,create_time,edit_time,article_id from article where user_id = ? or article_id in
             (select article_id from article_content where user_id = ?)
        order by last_post desc,edit_time desc,create_time desc,article_id desc
        limit ?,?`, [userId, userId, offset, limit]);
    }

    findTopics(isAdmin: boolean, offset: number, limit: number) {
        return cache_query(`select user_id, title, last_post, edit_time, create_time, article_id from article ${isAdmin ? "" : "where defunct = 'N'"}
        order by last_post desc,edit_time desc,create_time desc,article_id desc
        limit ?,?`, [offset, limit]);
    }

    countTopics(isAdmin: boolean, userTopicCount: boolean) {
        if (userTopicCount) {
            return cache_query(`select count(1) as cnt from article
             ${isAdmin ? "" : "where defunct = 'N'"}`);
        }
        return cache_query(`select count(1) as cnt from article 
        ${isAdmin ? "" : "where defunct = 'N'"}`);
    }

    findReplies(topicId: number, offset: number, limit: number) {
        return cache_query(`select * from 
            (select t.*,users.avatar,users.avatarUrl,users.nick,users.email from (select * from article_content where article_id = ?)t left join users
        on users.user_id = t.user_id)joint
         order by comment_id asc 
        limit ?,?`, [topicId, offset, limit]);
    }

    countReplies(topicId: number) {
        return cache_query("select count(1) as cnt from article_content where article_id = ?", [topicId]);
    }

    findTopicWithAuthor(topicId: number) {
        return cache_query(`select tmp.*,users.avatar,users.avatarUrl,users.nick,users.biography,users.solved,users.email from (
            select * from article where article_id = ?)
            tmp
            left join users on users.user_id = tmp.user_id
            `, [topicId]);
    }

    insertReply(topicId: number, userId: string, content: string) {
        return query(`insert into article_content(user_id,content,article_id)
        values(?,?,?)`, [userId, content, topicId]);
    }

    insertTopic(userId: string, title: string, content: string) {
        return query("insert into article(user_id,title,content)values(?,?,?)", [userId, title, content]);
    }

    updateTopic(topicId: number, userId: string, title: string, content: string) {
        return query("update article set title = ? , content = ?,edit_time = NOW(),last_post = NOW() where article_id = ? and user_id = ?",
            [title, content, topicId, userId]);
    }

    findTopicContent(topicId: number) {
        return query(`select content,title from article 
        where article_id = ?`, [topicId]);
    }

    updateReply(topicId: number, commentId: number, userId: string, content: string) {
        return query(`update article_content set content = ? 
        where article_id = ? and comment_id = ? and user_id = ?`, [content, topicId, commentId, userId]);
    }

    findReplyContent(topicId: number, commentId: number) {
        return query(`select content from article_content 
        where article_id = ? and comment_id = ?`, [topicId, commentId]);
    }

    blockReply(topicId: number, commentId: number) {
        return query(`update article_content set content = "该回复经管理员审核，已被屏蔽" where article_id = ? and
         comment_id = ?`, [topicId, commentId]);
    }

    searchTopics(val: string, offset: number, limit: number) {
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

        return query(sql, sqlArr);
    }

    findSpecialSubjectProblem(tid: number, pid: number) {
        return cache_query("SELECT * FROM special_subject_problem WHERE topic_id = ? and num = ?", [tid, pid]);
    }
}
