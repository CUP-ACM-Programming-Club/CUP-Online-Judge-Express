import AwaitLock from "await-lock";
import Cacheable from "../../decorator/Cacheable";
import {Request} from "express";
import "express-session";
const cache_query = require("../../module/mysql_cache");
const ContestCachePool = require("../../module/contest/ContestCachePool");
function safeArrayParse(array: any[] | any) {
    if (typeof array !== "object" && !array.length) {
        return [];
    }
    return array.length ? array : Object.keys(array);
}
class ContestManager {
    @Cacheable(ContestCachePool, 10, "minute")
    async getContestListByConditional(admin_str: String, myContest: string) {
        const notRunningSql = `select user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from (select * from contest where start_time < NOW() and end_time>NOW())ctest left join (select user_id,rightstr from privilege where rightstr like 'm%') p on concat('m',contest_id)=rightstr where ${admin_str} and ${myContest} order by end_time asc limit 1000;`;
        const runningSql = `select user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from (select * from contest where contest_id not in (select contest_id  from contest where start_time< NOW() and end_time > NOW()))ctest left join (select user_id,rightstr from privilege where rightstr like 'm%') p on concat('m',contest_id)=rightstr where ${admin_str} and ${myContest} order by contest_id desc limit 1000;`;
        const promiseArray = [cache_query(notRunningSql), cache_query(runningSql)];
        return (await Promise.all(promiseArray)).reduce((accumulator, currentValue) => accumulator.concat(currentValue));

    }

    getMyContestList(req: Request) {
        let myContest = " 1 = 1 ";
        if (req.query.myContest) {
            myContest = `(${safeArrayParse(req.session!.contest_maker).concat(safeArrayParse(req.session!.contest)).map((el: any) => el.substring(1)).join(",")})`;
            if (myContest === "()") {
                myContest = " 1 = 1 ";
            } else {
                myContest = `contest_id in ${myContest}`;
            }
        }
        return myContest;
    }

    async getContestList(req: Request) {
        return await this.getContestListByConditional(this.buildPrivilegeStr(req), this.getMyContestList(req))
    }

    private buildPrivilegeStr(req: Request) {
        let admin_str = " 1 = 1 ";
        if (!req.session!.isadmin && !req.session!.contest_manager) {
            admin_str += " and ctest.defunct = 'N' ";
        }
        // @ts-ignore
        if (global.contest_mode) {
            admin_str = `${admin_str} and ctest.cmod_visible = '${!req.session!.isadmin ? 1 : 0}'`;
        }
        return admin_str;
    }
}

export default new ContestManager();
