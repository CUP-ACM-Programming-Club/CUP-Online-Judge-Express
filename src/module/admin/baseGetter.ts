import isNumber from "../util/isNumber";
const { error, ok } = require("../constants/state");
const query = require("../mysql_query");
import express from "express";

export = function (target: string, baseId: string, middleware: any[] = []) {
	const router = express.Router();

	async function baseGetter(id: string) {
		return query(`select * from ${target} where ${baseId} = ?`, [id]);
	}

	router.get("/:id", ...middleware, async (req: any, res: any) => {
		let { id } = req.params;
		if (!isNumber(id)) {
			res.json(error.invalidParams);
		} else {
			try {
				res.json(ok.okMaker(await baseGetter(id)));
			} catch (e) {
				console.log(e);
				res.json(error.database);
			}
		}
	});
	return router;
};
