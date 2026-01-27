import { MySQLManager } from "../manager/mysql/MySQLManager";
import cache_query = require("../module/mysql_cache");
import query = require("../module/mysql_query");

class ExportService {

    async getRealUserID(nick: string) {
        if (typeof nick !== "string") {
            return undefined;
        }
        const data = await query("select user_id from users where nick = ?", [nick.trim()]);
        if (!!data && data.length > 0) {
            for (let el of data) {
                if (!isNaN(el.user_id)) {
                    return el.user_id;
                }
            }
            return undefined;
        } else {
            return undefined;
        }
    }

    async getContestCodeSet(contest_id: number | string) {
        const data = await query(`select S.user_id,nick,problem_id,result,source,S.language from source_code right join
(select solution_id,problem_id,user_id,result,language,num from solution where contest_id= ?
  and result = 4) S
on source_code.solution_id=S.solution_id
left join users on users.user_id = S.user_id
 order by S.user_id asc,S.num asc`, [contest_id]);

        let nickSet = data.map((el: any) => el.nick);
        nickSet = await Promise.all(nickSet.map((el: any) => this.getRealUserID(el)));
        for (let i = 0; i < data.length; ++i) {
            data[i].realUserID = nickSet[i];
        }
        return data;
    }
}

export default new ExportService();
