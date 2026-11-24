import express from "express";
import { listPage } from "../../../application/admin-table/AdminTableUseCases";
const { error, ok } = require("../../../domain/constants/state");
const admin = require("../middleware/admin");

/** 后台分页列表路由工厂。 */
export = function (target: string, opts: any = {}) {
	const router = express.Router();

	router.get("/:page", async (req: any, res: any) => {
		let page = parseInt(req.params.page);
		try {
			if (!isNaN(page)) {
				res.json(ok.okMaker(await listPage(target, opts, page)));
			} else {
				res.json(error.invalidParams);
			}
		} catch (e) {
			res.json(error.database);
			console.log(e);
		}
	});

	return ["/list", admin, router];
};
