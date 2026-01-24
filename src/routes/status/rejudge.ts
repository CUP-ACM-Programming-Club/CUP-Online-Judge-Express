import express from "express";
const router = express.Router();

router.post("/", async (req: any, res: any) => {
	await require("../../module/status/update_solution_result").router(req, res, 1);
});

module.exports = router;
