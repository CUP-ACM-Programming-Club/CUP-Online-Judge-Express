/** 专题列表 SQL（从 interfaces/http/routes/specialsubject 逐字搬来）。 */
import { SpecialSubjectRepository } from "../../../application/ports/SpecialSubjectRepository";

const cache_query = require("../../db/legacy/mysql_cache");

export class MySqlSpecialSubjectRepository implements SpecialSubjectRepository {
    findActive() {
        const sql = "SELECT * FROM `special_subject` WHERE defunct='N' ORDER BY `topic_id` ASC limit 1000";
        return cache_query(sql);
    }
}
