const express = require("express");
const cache_query = require("../../module/mysql_cache");
const query = cache_query;
const [error, ok] = require("../../module/const_var");
const isNumber = require("../../module/util/isNumber");
const router = express.Router();

const checkContestID = function(cid) {
	return !!(isNumber(cid) && parseInt(cid) >= 1000);
};



router.get("/:cid", (req, res) => {
	const cid = req.params.cid;
	if(!checkContestID(cid)) {
		res.json(error.invalidParams);
	}
});

module.exports = ["/user", router];