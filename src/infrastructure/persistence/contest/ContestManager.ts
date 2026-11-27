import Cacheable from "../../../shared/cache/Cacheable";
import Timer from "../../../shared/decorators/Timer";
import isNumber from "../../../shared/isNumber";
import ResponseLogger from "../../../shared/decorators/ResponseLogger";
import CachePool from "../../../shared/cache/CachePool";
import { MySQLManager } from "../../db/mysql/MySQLManager";
import PrivilegeManager from "../user/PrivilegeManager";
import ContestCachePool = require("../../cache/pools/ContestCachePool");
import { ContestListCriteria } from "../../../application/ports/ContestRepository";
import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存 */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };

/**
 * 列表 SQL 会把 session 里的比赛 id（myContestIds）直接拼进去，静态上无法排除其中出现 update/insert/delete 字样，
 * 所以这几处保留旧 mysql_cache 外壳的判定：小写 SQL 含这些字样时直接查询、不缓存，否则走 2s 缓存。
 */
function legacyCachedQuery(sql: string, params?: any[]) {
    const lower = sql.toLowerCase();
    if (lower.includes("update") || lower.includes("insert") || lower.includes("delete")) {
        return query(sql, params || []);
    }
    return cachedQuery<any>(sql, params, CACHE);
}
const PAGE_SIZE = 50;
interface searchQuery {
    sql: string | null,
    sqlArr: any[]
}

/**
 * 比赛表的数据访问（SQL 拼装 + 缓存）。从请求里推导筛选条件的部分在 application/services/ContestService，
 * 这里只接收推导好的 ContestListCriteria。
 */
class ContestManager {
    @Timer
    @Cacheable(ContestCachePool, 1, "second")
    getContestListByConditional(admin_str: string, myContest: string, search: searchQuery, limit: number) {
        const sql = this.buildSqlStructure(admin_str, myContest, search.sql);
        return legacyCachedQuery(`${sql} order by (IF(start_time < NOW() and end_time > NOW(), 1, 0))desc,
         (IF(start_time < NOW() and end_time > NOW(), end_time, 0)),
         (IF(start_time >= NOW() and end_time <= NOW(), contest_id, contest_id)) desc limit ?, ?`, [...search.sqlArr, limit, PAGE_SIZE]);
    }

    @Timer
    @Cacheable(ContestCachePool, 1, "second")
    async getContestListCountByConditional(admin_str: string, myContest: string, search: searchQuery) {
        const sql = this.buildSqlCountStructure(admin_str, myContest, search.sql);
        const countList = await legacyCachedQuery(`${sql}`, [...search.sqlArr]);
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
        return cachedQuery(`select maker as user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from contest order by contest_id desc`, undefined, CACHE);
    }

    async isContestSubmittable(contestId: number | string, userId: number | string) {
        const checkResult = await Promise.all([PrivilegeManager.isAdmin(userId), PrivilegeManager.isContestMaker(userId, contestId), PrivilegeManager.isContestManager(userId, contestId), PrivilegeManager.isContester(userId, contestId)]);
        return checkResult.reduce((a, b) => a || b);
    }

    @ResponseLogger
    buildSqlStructure(...args: (string | null | undefined)[]) {
        return `select maker as user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from contest where ${args.filter(e => typeof e === "string").join(" and ")}`;
    }

    @ResponseLogger
    buildSqlCountStructure(...args: (string | null | undefined)[]) {
        return `select count(1) as cnt from contest where ${args.filter(e => typeof e === "string").join(" and ")}`;
    }

    @Timer
    @Cacheable(ContestCachePool, 10, "minute")
    async countTotalNumber(sql: string) {
        const response = await legacyCachedQuery(`select count(1) as cnt from (${sql})t3`);
        if (response && response.length && response.length > 0) {
            return response[0].cnt;
        }
        else {
            return 0;
        }
    }

    /** 不带搜索条件的总数 */
    async getTotalNumber(criteria: ContestListCriteria) {
        const sql = this.buildSqlStructure(this.buildPrivilegeStr(criteria), this.getMyContestList(criteria.myContestIds));
        return await this.countTotalNumber(sql);
    }

    @Timer
    getMyContestList(myContestIds: string[] | null) {
        let myContest = " 1 = 1 ";
        if (myContestIds) {
            myContest = `(${myContestIds.join(",")})`;
            if (myContest === "()") {
                myContest = " 1 = 1 ";
            } else {
                myContest = `contest_id in ${myContest}`;
            }
        }
        return myContest;
    }

    @Timer
    getSearchSql(search: string | null) {
        let sql = " 1 = 1 ";
        if (typeof search === "string") {
            sql += ` and title like ? `;
            return {
                sql,
                sqlArr: [`%${search.trim()}%`]
            }
        }

        return {
            sql: null,
            sqlArr: []
        }
    }

    buildLimit(page: any) {
        const limit = (isNumber(page) ? parseInt(page) : 0) * PAGE_SIZE;
        return limit < 0 ? 0 : limit;
    }

    @Timer
    async getContestList(criteria: ContestListCriteria) {
        return await this.getContestListByConditional(this.buildPrivilegeStr(criteria), this.getMyContestList(criteria.myContestIds), this.getSearchSql(criteria.search), this.buildLimit(criteria.page));
    }

    @Timer
    async getContestListCount(criteria: ContestListCriteria) {
        return await this.getContestListCountByConditional(this.buildPrivilegeStr(criteria), this.getMyContestList(criteria.myContestIds), this.getSearchSql(criteria.search));
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
    buildPrivilegeStr(criteria: Pick<ContestListCriteria, "canSeeHidden" | "contestMode" | "isAdmin">) {
        let admin_str = " 1 = 1 ";
        if (!criteria.canSeeHidden) {
            admin_str += " and defunct = 'N' ";
        }
        if (criteria.contestMode) {
            admin_str = `${admin_str} and cmod_visible = '${!criteria.isAdmin ? 1 : 0}'`;
        }
        return admin_str;
    }
}

export default new ContestManager();
