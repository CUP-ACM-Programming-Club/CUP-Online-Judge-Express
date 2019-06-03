module.exports = function (target, opts = {}) {
	const express = require("express");
	const router = express.Router();
	const cache_query = require("../../module/mysql_cache");
	const PAGE_SIZE = 50;
	const [error, ok] = require("../../module/const_var");

	async function baseGetter(page) {
		let where = "", orderBy = "";
		if (opts.hasOwnProperty("where") && typeof opts.where === "string") {
			where = opts.where;
		}
		if (opts.hasOwnProperty("order") && typeof opts.order === "string") {
			orderBy = opts.order;
		}
		return await cache_query(`select * from ${target} ${[where, orderBy].join(" ")} limit ${page * PAGE_SIZE},${PAGE_SIZE}`);
	}

	router.get("/:page", async (req, res) => {
		let page = parseInt(req.params.page);
		try {
			if (!isNaN(page)) {
				res.json(ok.okMaker(await baseGetter(page)));
			} else {
				res.json(error.invalidParams);
			}
		} catch (e) {
			res.json(error.database);
			console.log(e);
		}
	});

	return ["/list", router];
};