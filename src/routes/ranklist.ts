const express = require("express");
const const_variable = require("../module/const_name");
const [error] = require("../module/const_var");
const router = express.Router();
import auth from "../middleware/auth";
import RanklistService from "../service/RanklistService";


function parseQuery(req: any) {
	return {
		page: req.query.page || 0,
		search: req.query.search || "",
		time_stamp: req.query.time_stamp,
		vjudge: req.query.vjudge || false
	};
}

const get_ranklist = async (req: any, res: any, opt: any = {}) => {
	try {
		const result = await RanklistService.getRanklist(opt);
		res.json(result);
	} catch (e) {
		if ((e as any) === error.invalidParams) {
			res.json(error.invalidParams);
		} else {
			console.error("Ranklist Error:", e);
			res.json(error.database);
		}
	}
};

router.get("/", async function (req: any, res: any) {
	await get_ranklist(req, res, parseQuery(req));
});

router.get("/acmmember", async function (req: any, res: any) {
	await get_ranklist(req, res, Object.assign(parseQuery(req), { acm_member: true }));
});

router.get("/oldmember", async function (req: any, res: any) {
	await get_ranklist(req, res, Object.assign(parseQuery(req), { retired_member: true }));
});

router.get("/user", async function (req: any, res: any) {
	try {
		const result = await RanklistService.getUserCount();
		res.json(result);
	}
	catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

const startRoute: any = ["/ranklist", auth, router];
startRoute.get_ranklist = get_ranklist;

export = startRoute;
