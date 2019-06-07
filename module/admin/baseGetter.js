const isNumber = require("../util/isNumber");
const [error, ok] = require("../const_var");
const query = require("../mysql_query");
module.exports = function (target, baseId) {
	const express = require("express");
	const router = express.Router();

	async function baseGetter(id) {
		return query(`select * from ${target} where ${baseId} = ?`, [id]);
	}

	router.get("/:id", async (req, res) => {
		let {id} = req.params;
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