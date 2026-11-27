/** 专题列表 SQL（从 interfaces/http/routes/specialsubject 逐字搬来）。 */
import { SpecialSubjectRepository } from "../../../application/ports/SpecialSubjectRepository";

import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

export class MySqlSpecialSubjectRepository implements SpecialSubjectRepository {
    findActive() {
        const sql = "SELECT * FROM `special_subject` WHERE defunct='N' ORDER BY `topic_id` ASC limit 1000";
        return cache_query(sql);
    }
}
