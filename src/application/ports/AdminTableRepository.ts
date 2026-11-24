import { definePort } from "./registry";

/**
 * 后台通用表操作（按主键取一行、切换 defunct、分页列表）。
 * table / idColumn / where / order 由路由代码写死传入，不来自用户输入。
 */
export interface AdminTableRepository {
	findById(table: string, idColumn: string, id: string | number): Promise<any[]>;
	getDefunct(table: string, idColumn: string, id: string | number): Promise<any[]>;
	setDefunct(table: string, idColumn: string, id: string | number, defunct: string): Promise<unknown>;
	page(table: string, where: string, orderBy: string, offset: number, size: number): Promise<any[]>;
	count(table: string, where: string, orderBy: string): Promise<any[]>;
}

export const adminTableRepository = definePort<AdminTableRepository>("AdminTableRepository");
