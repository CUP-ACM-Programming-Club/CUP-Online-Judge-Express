import { SubmissionUserRepository } from "../../../application/ports/SubmissionUserRepository";

import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

/** 自 application/user/user.ts 原样搬来。 */
export class MySqlSubmissionUserRepository implements SubmissionUserRepository {
	findUserById(userId: string) {
		return cache_query("select * from users where user_id = ?", [userId]);
	}

	findSolutionUser(solutionId: string | number) {
		return cache_query("select user_id from solution where solution_id = ?", [solutionId]);
	}
}
