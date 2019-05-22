const express = require("express");
const router = express.Router();
const infoHandler = require("../../module/status/info");
router.get("/:solution_id", async (req, res) => {
	const solution_id = req.params.solution_id;
	res.json(await infoHandler(req, "runtimeinfo", solution_id));
});

module.exports = ["/runtime_info", router];