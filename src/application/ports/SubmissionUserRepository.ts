import { definePort } from "./registry";

/** 提交领域里按用户 / 提交查用户。实现：infrastructure/persistence/submission/MySqlSubmissionUserRepository。 */
export interface SubmissionUserRepository {
	findUserById(userId: string): Promise<any[]>;
	/** 返回 [{user_id}] */
	findSolutionUser(solutionId: string | number): Promise<any[]>;
}

export const submissionUserRepository = definePort<SubmissionUserRepository>("SubmissionUserRepository");
