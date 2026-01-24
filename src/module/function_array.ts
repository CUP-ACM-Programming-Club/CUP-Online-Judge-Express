import query = require("./mysql_query");
import cachePool from "./cachePool";

const usr_admin = async (user_id: string): Promise<boolean> => {
	const _res = cachePool.get("user_admin:" + user_id);
	if (_res === undefined) {
		let sql = "select rightstr from privilege where user_id = ? and rightstr='administrator'";
		let sqlArr = [user_id];
		const dataList: any[] = await query(sql, sqlArr);
		if (dataList.length > 0) {
			cachePool.set("user_admin:" + user_id, true, 10 * 24 * 60 * 60);
			return true;
		}
		return false;
	} else {
		return true;
	}
};

const usr_contest = async (user_id: string, cid: string | number): Promise<boolean> => {
	const _res = cachePool.get("user_contest_" + cid + ":" + user_id);
	if (_res === undefined) {
		let sql = "select rightstr from privilege where user_id = ? and rightstr like ?";
		let sqlArr = [user_id, "c" + cid];
		const dataList: any[] = await query(sql, sqlArr);
		if (dataList.length > 0) {
			cachePool.set("user_contest_" + cid + ":" + user_id, true, 10 * 24 * 60 * 60);
			return true;
		}
		return false;
	} else {
		return true;
	}
};

const func_tree = {
	"admin": usr_admin,
	"contest": usr_contest
};

export = func_tree;