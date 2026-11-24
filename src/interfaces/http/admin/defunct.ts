import isNumber from "../../../shared/isNumber";
import express, {Request, Response} from "express";
import {error, ok} from "../../../domain/constants/state";
import { toggleDefunct } from "../../../application/admin-table/AdminTableUseCases";
const admin = require("../middleware/admin");

/** 后台「切换 defunct」路由工厂。 */
module.exports = function (target: string, idName: string) {
	const router = express.Router();

	router.get("/", (req: Request, res: Response) => {
		res.json(error.errorMaker("You should POST data to server"));
	});

	router.post("/", async (req: Request, res: Response) => {
		try {
			let {id} = req.body;
			if (isNumber(id)) {
				await toggleDefunct(target, idName, id);
				res.json(ok.ok);
			} else {
				res.json(error.invalidParams);
			}
		} catch (e) {
			console.log(e);
			res.json(error.database);
		}
	});

	return ["/defunct", admin, router];
};
