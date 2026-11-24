/* eslint-disable no-console */
import express from "express";
import SubmissionManager from "../../../../infrastructure/persistence/submission/SubmissionManager";
const router = express.Router();

router.get("/", async (req, res) => {
	res.json(await SubmissionManager.getSubmissionHourInfo(req));
});


export = router;
