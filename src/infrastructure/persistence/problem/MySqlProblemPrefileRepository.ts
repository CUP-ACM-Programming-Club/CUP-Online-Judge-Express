/** 前置/后置代码（prefile 表）SQL（原 PrependAppendManager 的数据访问部分）。 */
import { PrefileCode, PrefileRow, ProblemPrefileRepository } from "../../../application/ports/ProblemPrefileRepository";

import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 原先三条 SQL 都经 mysql_cache：select 走 2s 缓存，insert/delete 被识别为写语句直接查询 */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };

export class MySqlProblemPrefileRepository implements ProblemPrefileRepository {
    findByProblem(problemId: number | string, prepend: number): Promise<PrefileRow[]> {
        return cachedQuery(`select problem_id, prepend, code, type from prefile where problem_id = ? and prepend = ?`, [problemId, prepend], CACHE);
    }

    insert(problemId: number | string, prepend: number, e: PrefileCode) {
        return query(`insert into prefile(problem_id, prepend, code, type) values (?,?,?,?)`,
            [problemId, prepend, e.code, e.language]);
    }

    deleteByProblem(problemId: number | string, prepend: number) {
        return query(`delete from prefile where problem_id = ? and prepend = ?`, [problemId, prepend]);
    }
}
