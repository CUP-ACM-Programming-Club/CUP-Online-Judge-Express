import { definePort } from "./registry";

/**
 * 判题结束后按查重结果封禁比赛作弊者。
 * 实现：infrastructure/persistence/submission/SubmissionBanUserAdapter（委托 contest 领域的 BanUserManager）。
 */
export interface SubmissionBanUser {
	banUser(solutionPack: any): Promise<unknown>;
}

export const submissionBanUser = definePort<SubmissionBanUser>("SubmissionBanUser");
