const express = require("express");
const query = require("../../module/mysql_query");
const {error, ok} = require("../constants/state");
const admin = require("../../middleware/admin");


module.exports = function (target, opts = {}) {
	const router = express.Router();
	const PAGE_SIZE = 50;

	async function baseGetter(page) {
		let where = "", orderBy = "";
		if (Object.prototype.hasOwnProperty.call(opts, "where") && typeof opts.where === "string") {
			where = opts.where;
		}
		if (Object.prototype.hasOwnProperty.call(opts, "order") && typeof opts.order === "string") {
			orderBy = opts.order;
		}
		const Query = [query(`select * from ${target} ${[where, orderBy].join(" ")} limit ${page * PAGE_SIZE},${PAGE_SIZE}`)];
		Query.push(query(`select count(1) as cnt from ${target} ${[where, orderBy].join(" ")}`));
		const [data, count] = await Promise.all(Query);
		return {
			data,
			count: count[0].cnt
		};
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

	return ["/list", admin, router];
};
