import { definePort } from "./registry";

/**
 * 提交事务（第 2 期的提交原子化）：开启后在同一条连接上依次读比赛限制、写 solution / 源码 / 自定义输入，
 * 最后 commit；出错时 rollback；无论成败都 release（release 兜底回滚未结束的事务）。
 */
export interface SubmitTransaction {
	findContestLimitHostname(contestId: number): Promise<any[]>;
	findContestIpPolicy(contestId: number): Promise<any[]>;
	/** 插入题目提交，返回 {insertId} */
	insertProblemSolution(problemId: number, userId: string, language: number, ip: string, codeLength: number, share: boolean, judger: string, fingerprint: any, fingerprintRaw: any): Promise<any>;
	insertContestSolution(problemId: number, userId: string, language: number, ip: string, codeLength: number, contestId: number, num: number, judger: string, fingerprint: any, fingerprintRaw: any): Promise<any>;
	insertTopicSolution(problemId: number, userId: string, language: number, ip: string, codeLength: number, topicId: number, num: number, judger: string, fingerprint: any, fingerprintRaw: any): Promise<any>;
	insertSourceCodeUser(solutionId: number, source: string, hash: string): Promise<any>;
	insertSourceCode(solutionId: number, source: string): Promise<any>;
	insertCustomInput(solutionId: number, inputText: string): Promise<any>;
	commit(): Promise<any>;
	rollback(): Promise<any>;
	release(): Promise<void>;
}

/** 提交时的数据访问。实现：infrastructure/persistence/submission/MySqlSubmissionSubmitRepository。 */
export interface SubmissionSubmitRepository {
	beginTransaction(): Promise<SubmitTransaction>;
	/** 题目所在的、尚未结束的比赛 */
	findOngoingOrFutureContestsOfProblem(problemId: number): Promise<any[]>;
	findContestTime(contestId: number): Promise<any[]>;
	findContestLangmask(contestId: number): Promise<any[]>;
	findTopicLangmask(topicId: number): Promise<any[]>;
	/** [{private, defunct}] */
	findContestVisibility(contestId: number): Promise<any[]>;
	/** [{private, defunct}] */
	findTopicVisibility(topicId: number): Promise<any[]>;
	/** [{problem_id}] */
	findContestProblem(contestId: number, num: number): Promise<any[]>;
	/** [{problem_id}] */
	findTopicProblem(topicId: number, num: number): Promise<any[]>;
	/** [{defunct}] */
	findProblemDefunct(problemId: number): Promise<any[]>;
	/** 题目在该语言下的前置 / 后置代码 */
	findPrefiles(problemId: number, language: number): Promise<any[]>;
}

export const submissionSubmitRepository = definePort<SubmissionSubmitRepository>("SubmissionSubmitRepository");

/** 用户的登录 token 列表（cookie 登录兜底）。实现：infrastructure/persistence/submission/RedisSubmissionLoginTokens。 */
export interface SubmissionLoginTokens {
	listTokens(userId: string): Promise<string[]>;
}

export const submissionLoginTokens = definePort<SubmissionLoginTokens>("SubmissionLoginTokens");

/** 比赛可提交判定（委托 contest 领域）。实现：infrastructure/persistence/submission/SubmissionContestLookupAdapter。 */
export interface SubmissionContestLookup {
	isContestSubmittable(contestId: number, userId: string): Promise<boolean>;
}

export const submissionContestLookup = definePort<SubmissionContestLookup>("SubmissionContestLookup");
