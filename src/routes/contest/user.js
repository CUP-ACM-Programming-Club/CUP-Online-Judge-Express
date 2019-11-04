const express = require("express");
const {error} = require("../../module/constants/state");
const isNumber = require("../../module/util/isNumber").default;
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
