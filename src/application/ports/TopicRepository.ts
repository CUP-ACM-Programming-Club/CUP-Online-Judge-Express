import { definePort } from "./registry";

/** 讨论区（article / article_content）与专题题目。实现：infrastructure/persistence/problem/MySqlTopicRepository */
export interface TopicRepository {
	findUserTopics(userId: string, offset: number, limit: number): Promise<any[]>;
	findTopics(isAdmin: boolean, offset: number, limit: number): Promise<any[]>;
	/** userTopicCount 为 true 时是「我的帖子」页使用的计数语句（与旧实现一致，计数范围相同） */
	countTopics(isAdmin: boolean, userTopicCount: boolean): Promise<any[]>;
	findReplies(topicId: number, offset: number, limit: number): Promise<any[]>;
	countReplies(topicId: number): Promise<any[]>;
	findTopicWithAuthor(topicId: number): Promise<any[]>;
	insertReply(topicId: number, userId: string, content: string): Promise<unknown>;
	insertTopic(userId: string, title: string, content: string): Promise<any>;
	updateTopic(topicId: number, userId: string, title: string, content: string): Promise<unknown>;
	findTopicContent(topicId: number): Promise<any[]>;
	updateReply(topicId: number, commentId: number, userId: string, content: string): Promise<unknown>;
	findReplyContent(topicId: number, commentId: number): Promise<any[]>;
	blockReply(topicId: number, commentId: number): Promise<unknown>;
	/** 空关键词（val 为 "%%"）时按最近活跃排序列出全部 */
	searchTopics(likeValue: string, offset: number, limit: number): Promise<any[]>;
	findSpecialSubjectProblem(topicId: number, num: number): Promise<any[]>;
}

export const topicRepository = definePort<TopicRepository>("TopicRepository");
