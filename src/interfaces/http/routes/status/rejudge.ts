import express from "express";
const router = express.Router();

router.post("/", async (req: any, res: any) => {
	await require("../../controllers/RejudgeController").rejudgeRequestHandler(req, res, 1);
});

module.exports = router;
