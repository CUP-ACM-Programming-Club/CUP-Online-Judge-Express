import isNumber from "../util/isNumber";
import express, {Request, Response} from "express";
const query = require("../../module/mysql_query");
import {error, ok} from "../constants/state";

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

module.exports = function (target: string, idName: string) {
	const router = express.Router();
	async function baseChanger(base_id: number | string) {
		let res = await query(`select defunct from ${target} where ${idName} = ?`, [base_id]);
		const defunct = switchDefunct(res[0].defunct);
		query(`update ${target} set defunct = ? where ${idName} = ?`, [defunct, base_id]);
	}

	router.get("/", (req: Request, res: Response) => {
		res.json(error.errorMaker("You should POST data to server"));
	});

	router.post("/", async (req: Request, res: Response) => {
		try {
			let {id} = req.body;
			if (isNumber(id)) {
				await baseChanger(id);
				res.json(ok.ok);
			} else {
				res.json(error.invalidParams);
			}
		} catch (e) {
			console.log(e);
			res.json(error.database);
		}
	});

	return ["/defunct", router];
};
