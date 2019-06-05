const isNumber = require("../util/isNumber");
module.exports = function (target, idName) {
	const express = require("express");
	const router = express.Router();
	const query = require("../../module/mysql_query");
	const [error, ok] = require("../../module/const_var");

	function switchDefunct(defunct) {
		switch (defunct) {
		case "Y":
			return "N";
		case "N":
			return "Y";
		default:
			return "Y";
		}
	}

	async function baseChanger(base_id) {
		let res = await query(`select defunct from ${target} where ${idName} = ?`, [base_id]);
		const defunct = switchDefunct(res[0].defunct);
		query(`update ${target} set defunct = ? where ${idName} = ?`, [defunct, base_id]);
	}

	router.get("/", (req, res) => {
		res.json(error.errorMaker("You should POST data to server"));
	});

	router.post("/", async (req, res) => {
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