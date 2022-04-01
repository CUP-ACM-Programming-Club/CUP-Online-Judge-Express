import AwaitLock from "await-lock";
import Cacheable from "../../decorator/Cacheable";
import {Request} from "express";
import "express-session";
import Timer from "../../decorator/Timer";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import isNumber from "../../module/util/isNumber";
import ResponseLogger from "../../decorator/ResponseLogger";
import CachePool from "../../module/common/CachePool";
import {MySQLManager} from "../mysql/MySQLManager";
import PrivilegeManager from "../user/PrivilegeManager";
const cache_query = require("../../module/mysql_cache");
const ContestCachePool = require("../../module/contest/ContestCachePool");
const PAGE_SIZE = 50;
function safeArrayParse(array: any[] | any) {
    if (typeof array !== "object" && !array.length) {
        return [];
    }
    return array.length ? array : Object.keys(array);
}

interface searchQuery {
    sql: string | null,
    sqlArr: any[]
}

class ContestManager {
    @Timer
    @Cacheable(ContestCachePool, 1, "second")
    getContestListByConditional(admin_str: string, myContest: string, search: searchQuery, limit: number) {
        const sql = this.buildSqlStructure(admin_str, myContest, search.sql);
        return cache_query(`${sql} order by (IF(start_time < NOW() and end_time > NOW(), 1, 0))desc,
         (IF(start_time < NOW() and end_time > NOW(), end_time, 0)),
         (IF(start_time >= NOW() and end_time <= NOW(), contest_id, contest_id)) desc limit ?, ?`, [...search.sqlArr, limit, PAGE_SIZE]);
    }

    @Timer
    @Cacheable(ContestCachePool, 1, "second")
    getContestListCountByConditional(admin_str: string, myContest: string, search: searchQuery) {
        const sql = this.buildSqlCountStructure(admin_str, myContest, search.sql);
        const countList = cache_query(`${sql}`, [...search.sqlArr]);
        if (countList && countList.length && countList.length > 0) {
            return countList[0].cnt;
        }
        else {
            return 0;
        }
    }


    @Timer
    @Cacheable(new CachePool(), 1, "second")
    getAllContest() {
        return cache_query(`select maker as user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from contest order by contest_id desc`);
    }

    async isContestSubmittable(contestId: number | string, userId: number | string) {
        const checkResult = await Promise.all([PrivilegeManager.isAdmin(userId), PrivilegeManager.isContestMaker(userId, contestId), PrivilegeManager.isContestManager(userId, contestId), PrivilegeManager.isContester(userId, contestId)]);
        return checkResult.reduce((a, b) => a || b);
    }

    @ResponseLogger
    buildSqlStructure (...args: (string|null|undefined)[]) {
        return `select maker as user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from contest where ${args.filter(e => typeof e === "string").join(" and ")}`;
    }

    @ResponseLogger
    buildSqlCountStructure (...args: (string|null|undefined)[]) {
        return `select count(1) as cnt from contest where ${args.filter(e => typeof e === "string").join(" and ")}`;
    }

    @Timer
    @Cacheable(ContestCachePool, 10, "minute")
    async countTotalNumber(sql: string) {
        const response = await cache_query(`select count(1) as cnt from (${sql})t3`);
        if (response && response.length && response.length > 0) {
            return response[0].cnt;
        }
        else {
            return 0;
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getTotalNumber(req: Request) {
        const sql = this.buildSqlStructure(this.buildPrivilegeStr(req), this.getMyContestList(req));
        return await this.countTotalNumber(sql);
    }

    @Timer
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

    @Timer
    getSearchSql(req: Request) {
        let sql = " 1 = 1 ";
        if (typeof req.query.search === "string") {
            sql += ` and title like ? `;
            return {
                sql,
                sqlArr: [`%${req.query.search.trim()}%`]
            }
        }

        return {
            sql: null,
            sqlArr: []
        }
    }

    buildLimit(req: Request) {
        const page: any = req.query.page;
        const limit = (isNumber(page) ? parseInt(page) : 0) * PAGE_SIZE;
        return limit < 0 ? 0 : limit;
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Timer
    async getContestList(req: Request) {
        return await this.getContestListByConditional(this.buildPrivilegeStr(req), this.getMyContestList(req),this.getSearchSql(req) , this.buildLimit(req));
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Timer
    async getContestListAsObjectByRequest(req: Request) {
        let resultList: any[];
        let resultCount: any;
        [resultList, resultCount] = await Promise.all([this.getContestList(req), this.getContestListCountByConditional(this.buildPrivilegeStr(req), this.getMyContestList(req), this.getSearchSql(req))]);
        return {
            contestInfoList: resultList,
            total: resultCount
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Timer
    async getAllContestList() {
        return await this.getAllContest();
    }

    @Timer
    async removeAllCompetitorFromPrivilege(contestId: string | number) {
        return await MySQLManager.execQuery(`delete from privilege where rightstr = ?`, [`c${contestId}`]);
    }

    @Timer
    async addContestCompetitor(contestId: string | number, userList: string[]) {
        if (userList.length === 0) {
            return;
        }
        let baseSql = "insert into privilege (user_id, rightstr) values";
        let sqlArray: string[] = [], valueArray: string[] = [];
        userList.forEach(el => {
            sqlArray.push("(?,?)");
            valueArray.push(el, `c${contestId}`);
        });
        return await MySQLManager.execQuery(`${baseSql} ${sqlArray.join(",")}`, valueArray);
    }

    async updateContestCompetitor(contestIdList: (string | number)[], userList: string[], newContestIdList: (string | number)[]) {
        await Promise.all(contestIdList.map(e => this.removeAllCompetitorFromPrivilege(e)));
        await Promise.all(newContestIdList.map(e => this.addContestCompetitor(e, userList)));
    }

    async getContestCompetitorByContestId(contestId: string | number) {
        return await MySQLManager.execQuery("select user_id from privilege where rightstr = ?", [`c${contestId}`]);
    }

    @Timer
    private buildPrivilegeStr(req: Request) {
        let admin_str = " 1 = 1 ";
        if (!req.session!.isadmin && !req.session!.contest_manager) {
            admin_str += " and defunct = 'N' ";
        }
        // @ts-ignore
        if (global.contest_mode) {
            admin_str = `${admin_str} and cmod_visible = '${!req.session!.isadmin ? 1 : 0}'`;
        }
        return admin_str;
    }
}

export default new ContestManager();
