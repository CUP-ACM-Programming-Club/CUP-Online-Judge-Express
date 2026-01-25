import express from "express";
import ContestService from "../../service/ContestService";
import HttpError from "../../module/util/HttpError";
const router = express.Router();

router.get("/:contest_id", async (req: any, res: any) => {
	let contest_id = req.params.contest_id === undefined || isNaN(Number(req.params.contest_id)) ? -1 : parseInt(req.params.contest_id);
	try {
		if (~contest_id) {
			const result = await ContestService.getContestProblemList(req, contest_id);
			// Filter AC problems
			// Service returns "ac": 1 for AC.
			// rest_problem logic: remove accepted.
			const newArray = [];
			for (const prob of result.data) {
				if (prob.ac !== 1) {
					newArray.push(prob);
				}
			}
			result.data = newArray;
			res.json(result);
		} else {
			res.json(require("../../module/constants/state").error.database);
		}
	} catch (e) {
		// Original code returned error.database for everything?
		// catch (e) { res.json(error.database); }
		res.json(require("../../module/constants/state").error.database);
	}
});

module.exports = ["/rest", router];