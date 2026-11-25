import { Viewer } from "../../domain/policy/Viewer";
import HttpError from "../../domain/errors/HttpError";
import { error, ok } from "../../domain/constants/state";
import { canBrowseSource } from "../../domain/policy/predicates";
import { topicRepository } from "../ports/TopicRepository";

class TopicService {
    async getTopicList(page: number, limit: number, isAdmin: boolean, userId?: string) {
        // userId provided -> get my topics
        // userId not provided -> get all topics
        const offset = page * limit;
        if (userId) {
            const [_discuss_list, _tot] = await Promise.all([
                topicRepository.findUserTopics(userId, offset, limit),
                topicRepository.countTopics(isAdmin, true)
            ]);
            return {
                discuss: _discuss_list,
                total: _tot[0].cnt
            };
        } else {
            const [_discuss_list, _tot] = await Promise.all([
                topicRepository.findTopics(isAdmin, offset, limit),
                topicRepository.countTopics(isAdmin, false)
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
            topicRepository.findReplies(topicId, offset, limit),
            topicRepository.countReplies(topicId),
            topicRepository.findTopicWithAuthor(topicId)
        ]);

        if (!_article || _article.length === 0) {
            throw new HttpError("Topic not found", 404);
        }
        // 被隐藏的帖子：与列表一致，只对管理员（以及作者本人）可见（修复：之前直接打开详情就能看）
        if (!isAdmin && _article[0].defunct === "Y" && _article[0].user_id !== userId) {
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
        await topicRepository.insertReply(topicId, userId, content);
        return ok.serverReceived;
    }

    async addNewPost(userId: string, title: string, content: string) {
        const rows = await topicRepository.insertTopic(userId, title, content);
        return rows.insertId;
    }

    async updatePost(topicId: number, userId: string, title: string, content: string) {
        await topicRepository.updateTopic(topicId, userId, title, content);
    }

    async getPostContent(topicId: number) {
        const _main_content = await topicRepository.findTopicContent(topicId);
        if (_main_content && _main_content.length > 0) {
            return _main_content[0];
        } else {
            throw new HttpError("Post not found", 404);
        }
    }

    async updateReply(topicId: number, commentId: number, userId: string, content: string) {
        await topicRepository.updateReply(topicId, commentId, userId, content);
    }

    async getReplyContent(topicId: number, commentId: number) {
        const _reply_content = await topicRepository.findReplyContent(topicId, commentId);
        if (_reply_content && _reply_content.length > 0) {
            return _reply_content[0];
        } else {
            throw new HttpError("Reply not found", 404);
        }
    }

    async blockReply(topicId: number, commentId: number) {
        await topicRepository.blockReply(topicId, commentId);
    }

    async searchTopics(searchVal: string, page: number, limit: number) {
        const offset = page * limit;
        const val = `%${searchVal}%`;
        return await topicRepository.searchTopics(val, offset, limit);
    }
    async getTopicProblemDetails(req: Viewer, tid: number, pid: number) {
        const isPrivileged = canBrowseSource(req);
        // @ts-ignore
        if (!isPrivileged && global.contest_mode) {
            throw error.contestMode;
        }

        const result = await topicRepository.findSpecialSubjectProblem(tid, pid);
        if (result.length > 0) {
            let problem_id = result[0].problem_id;
            const ProblemService = require("./ProblemService").default;
            return await ProblemService.getProblem(req, {
                id: problem_id,
                source: "",
                after_contest: true
            });
        } else {
            throw error.invalidParams;
        }
    }
}

export default new TopicService();
