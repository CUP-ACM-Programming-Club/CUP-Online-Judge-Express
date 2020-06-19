import {Request, Response} from "express";
import dayjs from "dayjs";
import {error, ok} from "../../module/constants/state";
import cache_query = require("../../module/mysql_cache");
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import ContestModeChecker from "../../decorator/common/ContestModeChecker";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

const ProblemSetCachePool = require("../module/problemset/ProblemSetCachePool");
const NONE_PRIVILEGE_AND_SQL = ` and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) `;
const page_cnt = 50;

function sort_string(sort: any) {
    const _sort = ["asc", "desc"];
    return _sort[sort] || "asc";
}


function order_rule(order: any, sort: string) {
    const _order_rule: { [key: string]: string } = {
        "submit": `submit ${sort}`,
        "accepted": `accepted ${sort}`,
        "present": `accepted/submit ${sort},submit ${sort}`,
        "problem_id": `problem_id ${sort}`
    };
    return _order_rule[order] || "problem_id asc";
}



class ProblemSetManager {

    @Cacheable(new CachePool(), 10, "minute")
    async getListObject(user_id: string, payload: any, one_month_ago: any) {
        const {problem_id, title, source, accepted, submit, label, in_date} = payload;
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

    makeCacheKey(req: Request) {
        const params = req.params;
        const query = req.query;
        const privilegeKey = `admin:${req.session!.isadmin} source_browser:${req.session!.source_browser}`;
        let paramKey = "", queryKey = "";
        for (const key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                paramKey += `${key}: ${params[key]}`;
            }
        }
        for (const key in query) {
            if (Object.prototype.hasOwnProperty.call(query, key)) {
                queryKey += `${key}: ${query[key]}`;
            }
        }
        return `${paramKey},${queryKey},${privilegeKey}`;
    }

    @ErrorHandlerFactory(ok.okFlatMaker)
    @ContestModeChecker(1)
    async getProblem(req: Request, res: Response) {
        const target = req.query.source || "local";
        let search_table = target === "local" ? "problem" : target === "virtual" ? "vjudge_problem" : "problem";
        const start = parseInt(req.params.start);
        let search: string | boolean = req.params.search;
        if (search === "none") {
            search = false;
        }
        let label: any = req.query.label;
        if (typeof label !== "string") {
            label = false;
        }
        const _from = req.query.from || "";
        let from = undefined;
        if (_from && _from.length >= 3 && _from.length <= 6) {
            from = _from;
        }
        const has_from = from !== undefined;
        let order = req.params.order || "problem_id";
        let rule = req.params.order_rule || 0;
        order = order_rule(order, sort_string(rule));
        if (search) {
            search = `%${search}%`;
        }
        let result, total_num, _total, recent_one_month, one_month_add_problem = undefined;
        const one_month_ago = dayjs().subtract(1, "month").format("YYYY-MM-DD");
        const browse_privilege = req.session!.isadmin || req.session!.source_browser || req.session!.editor;
        console.time("get info");
        if (browse_privilege) {
            if (search) {
                [_total, result] = await this.searchHandler({search, label, has_from, from, start, search_table, order});
            }
            else {
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
                [_total, result, recent_one_month] = await Promise.all(promiseArray);
            }
        }
        else {
            if (search) {
                [_total, result] = await this.searchHandler({
                    search,
                    label,
                    has_from,
                    from,
                    start,
                    search_table,
                    order
                }, true);
            } else {
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
                [_total, result, recent_one_month] = await Promise.all(promiseArray);
            }
        }
        console.timeEnd("get info");
        total_num = parseInt(_total[0].cnt);
        if (recent_one_month && recent_one_month.length > 0) {
            one_month_add_problem = recent_one_month[0].cnt;
        }
        console.time("manage map");
        let send_problem_list = await Promise.all([...result.map((e: any) => this.getListObject(req.session!.user_id, e, one_month_ago))]);
        console.timeEnd("manage map");
        let send_target: { [key: string]: any } = {
            problem: send_problem_list,
            color: await this.getColorSetting(),
            total: total_num,
            recent_one_month: one_month_add_problem,
            step: page_cnt
        };
        if (search_table === "vjudge_problem") {
            send_target.from = (await cache_query("select name from vjudge_source")).map((val: any) => val.name);
        }
        return send_target;
    }

    @Cacheable(new CachePool(), 1, "day")
    async getColorSetting () {
        const colorSetting = await cache_query("select value from global_setting where label='label_color'");
        return Array.isArray(colorSetting) && colorSetting.length > 0 ? JSON.parse(colorSetting[0].value) : {};
    }

    @Cacheable(new CachePool(), 1, "hour")
    async getProblemList (search_table: string, has_from: boolean, label: boolean, order: string, sqlArr: any[]) {
        return await cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} ${NONE_PRIVILEGE_AND_SQL}
			order by ${order}
		 	limit ?,?`, sqlArr)
    }

    @Cacheable(new CachePool(), 12, "hour")
    async searchHandler(val: any = {}, normal = false) {
        let {search, label, has_from, from, start, search_table, order} = val;
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

export default new ProblemSetManager();
