import { definePort } from "./registry";

/** 导出（比赛 AC 代码、题目 rpk 包）的数据访问。实现：infrastructure/persistence/submission/MySqlSubmissionExportRepository。 */
export interface SubmissionExportRepository {
	/** [{user_id}] */
	findUserIdsByNick(nick: string): Promise<any[]>;
	/** 比赛内全部 AC 提交与源码 */
	findContestAcceptedCode(contestId: number | string): Promise<any[]>;
	findProblem(problemId: any): Promise<any[]>;
	/** 该题用时最短的一份提交源码 */
	findFastestSolution(problemId: any): Promise<any[]>;
	findPrefiles(problemId: any): Promise<any[]>;
	findContestProblems(contestId: number): Promise<any[]>;
}

export const submissionExportRepository = definePort<SubmissionExportRepository>("SubmissionExportRepository");
