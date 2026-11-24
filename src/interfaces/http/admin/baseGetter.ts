import isNumber from "../../../shared/isNumber";
import express from "express";
import { getRowById } from "../../../application/admin-table/AdminTableUseCases";
const { error, ok } = require("../../../domain/constants/state");

/** 后台「按主键取一行」路由工厂。 */
export = function (target: string, baseId: string, middleware: any[] = []) {
	const router = express.Router();

	router.get("/:id", ...middleware, async (req: any, res: any) => {
		let { id } = req.params;
		if (!isNumber(id)) {
			res.json(error.invalidParams);
		} else {
			try {
				res.json(ok.okMaker(await getRowById(target, baseId, id)));
			} catch (e) {
				console.log(e);
				res.json(error.database);
			}
		}
	});
	return router;
};
