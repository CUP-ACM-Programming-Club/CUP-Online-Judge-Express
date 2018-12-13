const express = require("express");
const router = express.Router();
const [error,ok] = require("../../module/const_var");
const query = require("../../module/mysql_query");

router.post("/", async (req,res) => {
	try {
		const solution_id = req.body.solution_id;
		if (typeof solution_id === "undefined" || isNaN(solution_id)) {
			res.json(error.solutionIdNotValid);
		}
		else {
			await query("update solution set result = 15 where solution_id = ?", [solution_id]);
			res.json(ok.ok);
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;