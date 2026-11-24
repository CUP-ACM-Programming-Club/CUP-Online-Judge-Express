import { definePort } from "./registry";

/**
 * 提交的读查询（状态页详情、编译/运行信息、查重、源码查看、统计）。
 * 实现：infrastructure/persistence/submission/MySqlSubmissionQueryRepository。
 */
export interface SubmissionQueryRepository {
	/** 查重记录（可按比赛过滤），附带双方昵称 */
	findSimRelatedSolutions(contestId?: number): Promise<any[]>;
	/** 比赛内的查重记录 */
	findContestSim(contestId: any): Promise<any[]>;
	findRuntimeInfo(solutionId: number | string): Promise<any[]>;
	findCompileInfo(solutionId: number | string): Promise<any[]>;
	/** 从 compileinfo / runtimeinfo 表取 error */
	findInfoError(table: string, solutionId: any): Promise<any[]>;
	/** [{user_id}] */
	findSolutionUser(solutionId: any): Promise<any[]>;
	/** 提交基本信息（含是否可公开分享） */
	findSharedSolutionInfo(solutionId: number | string): Promise<any[]>;
	findSolutionDetail(solutionId: number | string): Promise<any[]>;
	countByResult(): Promise<any[]>;
	/** statement / sqlArr 由调用方给出的筛选条件 */
	findAcceptedCodeLength(statement: string, sqlArr: any[]): Promise<any[]>;
	findUserSourceCode(solutionId: number | string): Promise<any[]>;
	/** 源码查看：local=true 查本地提交，否则 vjudge；browseCode=false 时只能看自己的 / 分享的 / 题解里的 */
	findSourceView(local: boolean, solutionId: number, browseCode: boolean, userId: any): Promise<any[]>;
	/** [{oj_name}] */
	findVjudgeOjName(solutionId: number): Promise<any[]>;
	/** ACM 队员最近 500 条提交（本地 + vjudge），userId 为空时不过滤 */
	findRecentAcmSubmissions(userId?: string): Promise<any[]>;
	/** 按小时统计提交 / 登录（1 小时缓存） */
	getSubmissionHourInfo(): Promise<any>;
	/** 维护记录，limit 为 true 时只取最新一条 */
	findMaintainInfo(limit: boolean): Promise<any[]>;
}

export const submissionQueryRepository = definePort<SubmissionQueryRepository>("SubmissionQueryRepository");
