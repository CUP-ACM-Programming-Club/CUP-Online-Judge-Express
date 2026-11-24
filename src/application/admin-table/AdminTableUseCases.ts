import { adminTableRepository } from "../ports/AdminTableRepository";

export const ADMIN_LIST_PAGE_SIZE = 50;

function switchDefunct(defunct: string) {
	switch (defunct) {
	case "Y":
		return "N";
	case "N":
		return "Y";
	default:
		return "Y";
	}
}

export async function getRowById(table: string, idColumn: string, id: string) {
	return adminTableRepository.findById(table, idColumn, id);
}

/** 读当前 defunct，取反后写回（写回不等待完成，与重构前一致）。 */
export async function toggleDefunct(table: string, idColumn: string, id: number | string) {
	const res = await adminTableRepository.getDefunct(table, idColumn, id);
	const defunct = switchDefunct(res[0].defunct);
	adminTableRepository.setDefunct(table, idColumn, id, defunct);
}

export async function listPage(table: string, opts: { where?: string, order?: string }, page: number) {
	let where = "", orderBy = "";
	if (Object.prototype.hasOwnProperty.call(opts, "where") && typeof opts.where === "string") {
		where = opts.where;
	}
	if (Object.prototype.hasOwnProperty.call(opts, "order") && typeof opts.order === "string") {
		orderBy = opts.order;
	}
	const [data, count] = await Promise.all([
		adminTableRepository.page(table, where, orderBy, page * ADMIN_LIST_PAGE_SIZE, ADMIN_LIST_PAGE_SIZE),
		adminTableRepository.count(table, where, orderBy)
	]);
	return {
		data,
		count: count[0].cnt
	};
}
