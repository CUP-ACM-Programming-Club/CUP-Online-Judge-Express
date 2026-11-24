import { definePort } from "./registry";

export interface SolutionInfoDAO {
	problem_id: number,
	user_id: string,
	language: number
	solution_id: number,
	time: number,
	memory: number,
	in_date: string,
	result: number,
	ip: string,
	contest_id: number,
	topic_id: number,
	valid: number,
	pass_point: number,
	num: number,
	code_length: number,
	judgetime: string,
	pass_rate: number,
	judger: string,
	share: number,
	fingerprint: string,
	fingerprintRaw: string
}

export interface ExportSolutionInfo {
	user_id: string,
	problem_id: number,
	solution_id: number,
	nick: string,
	source: string,
	in_date: string,
	result: number,
	result_string?: string,
}

/**
 * 单个提交的判题信息与比赛提交导出。
 * 实现：infrastructure/persistence/submission/MySqlSubmissionSolutionRepository（委托 SubmissionManager / CompileInfoManager / RuntimeInfoManager）。
 */
export interface SubmissionSolutionRepository {
	getSolutionInfo(solutionId: number): Promise<SolutionInfoDAO | null>;
	/** compileinfo 行，不存在为 null */
	getCompileInfo(solutionId: number): Promise<{ error: string } | null>;
	/** runtimeinfo 行，不存在为 null */
	getRuntimeInfo(solutionId: number): Promise<{ error: string } | null>;
	/** 比赛全部提交（含源码、昵称），按 user_id、problem_id、solution_id 排序 */
	getSolutionExportInfoByContestId(contestId: number | string): Promise<ExportSolutionInfo[]>;
}

export const submissionSolutionRepository = definePort<SubmissionSolutionRepository>("SubmissionSolutionRepository");
