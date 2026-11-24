/* eslint-disable no-console */
import express from "express";
import SubmissionStatsController from "../../controllers/SubmissionStatsController";
const router = express.Router();

router.get("/", async (req, res) => {
	res.json(await SubmissionStatsController.getSubmissionHourInfo(req));
});


export = router;
