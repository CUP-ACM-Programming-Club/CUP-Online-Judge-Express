import { definePort } from "./registry";

/**
 * 源码查看权限（admin / source_browser / 该提交所属比赛的助教），带 10 秒缓存。
 * 实现：infrastructure/persistence/submission/SourcePrivilegeCache。
 */
export interface SubmissionSourcePrivilege {
	checkPrivilege(session: any, solutionId: number): Promise<boolean>;
}

export const submissionSourcePrivilege = definePort<SubmissionSourcePrivilege>("SubmissionSourcePrivilege");
