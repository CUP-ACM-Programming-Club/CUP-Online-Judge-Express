import { SubmitContextRepository } from "../../../application/ports/SubmitContextRepository";
import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

/** SQL 自 bin/main.ts 的 submit 处理原样搬来 */
export class MySqlSubmitContextRepository implements SubmitContextRepository {
	async findUserAvatar(userId: string) {
		const rows = await cache_query("select avatar,avatarUrl from users where user_id = ?", [userId]);
		return rows.length ? { avatar: rows[0].avatar, avatarUrl: rows[0].avatarUrl } : null;
	}

	async findContestProblemId(contestId: number, num: any) {
		const rows = await cache_query("SELECT problem_id FROM contest_problem WHERE contest_id=? and num=?", [contestId, num]);
		return rows.length && rows[0].problem_id ? rows[0].problem_id : null;
	}

	async findTopicProblemId(topicId: number, num: any) {
		const rows = await cache_query("SELECT problem_id FROM special_subject_problem WHERE topic_id = ? and num = ?", [topicId, num]);
		return rows.length && rows[0].problem_id ? rows[0].problem_id : null;
	}

	async isProblemHidden(problemId: number) {
		const rows = await cache_query("SELECT 1 FROM problem WHERE problem_id = ? AND defunct = 'Y'", [problemId]);
		return rows.length > 0;
	}
}
