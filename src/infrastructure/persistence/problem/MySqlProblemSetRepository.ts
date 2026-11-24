/**
 * 题库列表 SQL（原 ProblemSetManager 的数据访问部分，SQL 逐字搬来）。
 * HTTP 参数解析与比赛模式检查在 interfaces/http/controllers/ProblemSetController，
 * 列表组装在 application/problemset/ProblemSetUseCases。
 */
import dayjs from "dayjs";
import cache_query = require("../../db/legacy/mysql_cache");
import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";
import {
    PROBLEMSET_PAGE_SIZE,
    ProblemSetListQuery,
    ProblemSetRepository,
    ProblemSetSearchQuery
} from "../../../application/ports/ProblemSetRepository";

const NONE_PRIVILEGE_AND_SQL = ` and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) `;
const page_cnt = PROBLEMSET_PAGE_SIZE;

export class MySqlProblemSetRepository implements ProblemSetRepository {

    @Cacheable(new CachePool(), 10, "minute")
    async getListObject(user_id: string, payload: any, one_month_ago: string) {
        const { problem_id, title, source, accepted, submit, label, in_date } = payload;
        let acnum = await cache_query(`select count(1) as cnt from solution where user_id=? and problem_id = ?
		and result=4 union all select count(1) as cnt from solution where user_id=? and problem_id=?`, [user_id, problem_id, user_id, problem_id]);
        let ac = parseInt(acnum[0].cnt);
        let mySubmit = parseInt(acnum[1].cnt);
        return {
            problem_id: problem_id,
            ac: ac > 0 ? true : mySubmit > 0 ? false : -1,
            title: title,
            source: source,
            submit: submit,
            accepted: accepted,
            label: label,
            new: dayjs(in_date).isAfter(one_month_ago)
        };
    }

    async listForPrivileged({ search_table, has_from, from, label, start, order, one_month_ago }: ProblemSetListQuery) {
        let sqlArr = [];
        if (has_from) {
            sqlArr.push(from);
        }
        if (label) {
            sqlArr.push(`%${label}%`);
        }
        sqlArr.push(start * page_cnt, page_cnt);
        const sqlState = () => {
            const where = (has_from || label) ? "where" : "";
            let statmentArr = [];
            if (has_from) {
                statmentArr.push("source = ?");
            }
            if (label) {
                statmentArr.push("label like ?");
            }
            return where + " " + statmentArr.join(" and ");
        };
        let promiseArray = [cache_query(`select count(1) as cnt from ${search_table} ${sqlState()}`,
            sqlArr), cache_query(`select problem_id,title,source,submit,accepted,in_date,label from ${search_table} 
			${sqlState()} order by ${order} limit ?,?`, sqlArr)];
        if (!has_from && !label) {
            promiseArray.push(cache_query(`select count(1) as cnt from ${search_table} where 
			    in_date > '${one_month_ago}'`));
        }
        return await Promise.all(promiseArray);
    }

    async listForPublic({ search_table, has_from, from, label, start, order, one_month_ago }: ProblemSetListQuery) {
        let sqlArr = [];
        if (has_from) {
            sqlArr.push(from);
        }
        if (label) {
            sqlArr.push(`%${label}%`);
        }
        sqlArr.push(start * page_cnt, page_cnt);
        let promiseArray = [cache_query(`select count(1) as cnt from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} ${NONE_PRIVILEGE_AND_SQL}
			`, sqlArr),
        this.getProblemList(search_table, has_from, label, order, sqlArr)];
        if (!has_from && !label) {
            promiseArray.push(cache_query(`select count(1) as cnt from problem where defunct='N' and in_date > ${one_month_ago}
			    ${NONE_PRIVILEGE_AND_SQL}`));
        }
        return await Promise.all(promiseArray);
    }

    @Cacheable(new CachePool(), 1, "day")
    async getColorSetting() {
        const colorSetting = await cache_query("select value from global_setting where label='label_color'");
        return Array.isArray(colorSetting) && colorSetting.length > 0 ? JSON.parse(colorSetting[0].value) : {};
    }

    findVjudgeSources() {
        return cache_query("select name from vjudge_source");
    }

    @Cacheable(new CachePool(), 1, "hour")
    async getProblemList(search_table: string, has_from: boolean, label: boolean, order: string, sqlArr: any[]) {
        return await cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} ${NONE_PRIVILEGE_AND_SQL}
			order by ${order}
		 	limit ?,?`, sqlArr)
    }

    @Cacheable(new CachePool(), 12, "hour")
    async searchHandler(val: any = {}, normal = false) {
        let { search, label, has_from, from, start, search_table, order } = val as ProblemSetSearchQuery;
        let sqlArr = [search, search, search, search, search, search, has_from ? from : search];
        if (label) {
            sqlArr.push(`%${label}%`);
        }
        sqlArr.push(start * page_cnt, page_cnt);
        return await Promise.all([cache_query(`select count(1) as cnt from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			${normal ? `and defunct='N' ${NONE_PRIVILEGE_AND_SQL}` : ""}
			`, sqlArr),
        cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			${normal ? `and defunct='N' ${NONE_PRIVILEGE_AND_SQL}` : ""}
			order by ${order}
		 	limit ?,?`, sqlArr)]);
    }
}
