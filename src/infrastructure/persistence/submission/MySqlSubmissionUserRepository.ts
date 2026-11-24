import { SubmissionUserRepository } from "../../../application/ports/SubmissionUserRepository";

const cache_query = require("../../db/legacy/mysql_cache");

/** 自 application/user/user.ts 原样搬来。 */
export class MySqlSubmissionUserRepository implements SubmissionUserRepository {
	findUserById(userId: string) {
		return cache_query("select * from users where user_id = ?", [userId]);
	}

	findSolutionUser(solutionId: string | number) {
		return cache_query("select user_id from solution where solution_id = ?", [solutionId]);
	}
}
