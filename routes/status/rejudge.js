const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
	await require("../../module/status/update_solution_result")(req, res, 1);
});

module.exports = router;
