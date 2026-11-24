import dayjs from "dayjs";
import { PROBLEMSET_PAGE_SIZE, problemSetRepository } from "../ports/ProblemSetRepository";

const page_cnt = PROBLEMSET_PAGE_SIZE;

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

/** 题库列表请求参数（原样取自 req.params / req.query） */
export interface ProblemSetListRequest {
	source: any;
	start: any;
	search: any;
	label: any;
	from: any;
	order: any;
	orderRule: any;
	/** canBrowseSource || isEditor */
	browsePrivilege: boolean;
	userId: string;
}

/** 题库列表：解析分页/排序/筛选参数，按权限选择查询，组装列表。 */
export class ProblemSetUseCases {
	async getProblemList(r: ProblemSetListRequest) {
		const target = r.source || "local";
		let search_table = target === "local" ? "problem" : target === "virtual" ? "vjudge_problem" : "problem";
		const start = parseInt(r.start) || 0;
		let search: string | boolean = r.search;
		if (search === "none") {
			search = false;
		}
		let label: any = r.label;
		if (typeof label !== "string") {
			label = false;
		}
		const _from: any = r.from || "";
		let from: any = undefined;
		if (_from && _from.length >= 3 && _from.length <= 6) {
			from = _from;
		}
		const has_from = from !== undefined;
		let order = r.order || "problem_id";
		let rule = r.orderRule || 0;
		order = order_rule(order, sort_string(rule));
		if (search) {
			search = `%${search}%`;
		}
		let result, total_num, _total, recent_one_month, one_month_add_problem = undefined;
		const one_month_ago = dayjs().subtract(1, "month").format("YYYY-MM-DD");
		const browse_privilege = r.browsePrivilege;
		console.time("get info");
		if (browse_privilege) {
			if (search) {
				[_total, result] = await problemSetRepository.searchHandler({ search, label, has_from, from, start, search_table, order });
			}
			else {
				[_total, result, recent_one_month] = await problemSetRepository.listForPrivileged({ search_table, has_from, from, label, start, order, one_month_ago });
			}
		}
		else {
			if (search) {
				[_total, result] = await problemSetRepository.searchHandler({
					search,
					label,
					has_from,
					from,
					start,
					search_table,
					order
				}, true);
			} else {
				[_total, result, recent_one_month] = await problemSetRepository.listForPublic({ search_table, has_from, from, label, start, order, one_month_ago });
			}
		}
		console.timeEnd("get info");
		total_num = parseInt(_total[0].cnt);
		if (recent_one_month && recent_one_month.length > 0) {
			one_month_add_problem = recent_one_month[0].cnt;
		}
		console.time("manage map");
		let send_problem_list = await Promise.all([...result.map((e: any) => problemSetRepository.getListObject(r.userId, e, one_month_ago))]);
		console.timeEnd("manage map");
		let send_target: { [key: string]: any } = {
			problem: send_problem_list,
			color: await problemSetRepository.getColorSetting(),
			total: total_num,
			recent_one_month: one_month_add_problem,
			step: page_cnt
		};
		if (search_table === "vjudge_problem") {
			send_target.from = (await problemSetRepository.findVjudgeSources()).map((val: any) => val.name);
		}
		return send_target;
	}
}

export default new ProblemSetUseCases();
