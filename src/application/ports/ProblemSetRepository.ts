import { definePort } from "./registry";

/** 题库列表每页条数 */
export const PROBLEMSET_PAGE_SIZE = 50;

export interface ProblemSetListQuery {
	search_table: string;
	has_from: boolean;
	from: any;
	label: any;
	start: number;
	order: string;
	one_month_ago: string;
}

export interface ProblemSetSearchQuery {
	search: any;
	label: any;
	has_from: boolean;
	from: any;
	start: number;
	search_table: string;
	order: string;
}

/**
 * 题库列表页的查询（带缓存）。
 * 实现：infrastructure/persistence/problem/MySqlProblemSetRepository
 */
export interface ProblemSetRepository {
	/** 有查看权限时的列表：[总数行, 列表, 近一月新增行(仅无筛选时)] */
	listForPrivileged(q: ProblemSetListQuery): Promise<any[]>;
	/** 普通用户的列表（只含公开且不在进行中/私有比赛里的题）：[总数行, 列表, 近一月新增行(仅无筛选时)] */
	listForPublic(q: ProblemSetListQuery): Promise<any[]>;
	/** 关键词搜索：[总数行, 列表]；normal 为 true 时只搜公开题 */
	searchHandler(val: ProblemSetSearchQuery, normal?: boolean): Promise<any[]>;
	/** 列表中一道题的展示对象（含当前用户是否 AC） */
	getListObject(user_id: string, payload: any, one_month_ago: string): Promise<any>;
	getColorSetting(): Promise<any>;
	findVjudgeSources(): Promise<any[]>;
}

export const problemSetRepository = definePort<ProblemSetRepository>("ProblemSetRepository");
