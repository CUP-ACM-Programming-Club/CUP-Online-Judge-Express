const express = require("express");
const router = express.Router();
const [error] = require("../../../module/const_var");
const cache_query = require("../../../module/mysql_cache");
const dayjs = require("dayjs");

function validateAttribute(targetObject, id) {
	if (isNaN(targetObject[id])) {
		return -1;
	} else {
		return parseInt(targetObject[id]);
	}
}

router.get("/", async (req, res) => {
	try {

	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

async function problemCodeLengthHandler(req, res, problem_id) {

}

router.get("/problem/:problem_id", async (req, res) => {
	try {
		let problem_id = validateAttribute(req.params, "problem_id");
		if (problem_id === -1) {
			return res.json(error.invalidParams);
		}
		await problemCodeLengthHandler(req, res, problem_id);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/contest/:contest_id", async (req, res) => {
	try {
		let contest_id = validateAttribute(req.params, "contest_id");
		if (contest_id === -1) {
			return res.json(error.invalidParams);
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});
