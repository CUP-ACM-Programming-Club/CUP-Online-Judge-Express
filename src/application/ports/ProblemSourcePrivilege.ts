import { definePort } from "./registry";

/**
 * problem 领域需要的「能否查看某条提交源码」判断（admin | source_browser | 所属比赛助教）。
 * 实现：infrastructure/persistence/problem/SubmissionSourcePrivilegeAdapter（委托 submission 领域现有实现）
 */
export interface ProblemSourcePrivilege {
	checkPrivilege(session: any, solutionId: number): Promise<boolean>;
}

export const problemSourcePrivilege = definePort<ProblemSourcePrivilege>("ProblemSourcePrivilege");
