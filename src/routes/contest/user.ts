import express from "express";
const { error } = require("../../module/constants/state");
import isNumber from "../../module/util/isNumber";
const router = express.Router();

const checkContestID = function (cid: any) {
	return !!(isNumber(cid) && parseInt(cid) >= 1000);
};



router.get("/:cid", (req: any, res: any) => {
	const cid = req.params.cid;
	if (!checkContestID(cid)) {
		res.json(error.invalidParams);
	}
});

module.exports = ["/user", router];
