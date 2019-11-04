import isNumber from "../util/isNumber";
import {Request, Response} from "express";
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
	const express = require("express");
	const router = express.Router();
	const query = require("../../module/mysql_query");
	const [error, ok] = require("../../module/const_var");

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
