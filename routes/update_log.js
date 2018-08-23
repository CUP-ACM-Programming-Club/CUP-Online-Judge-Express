const express = require("express");
const router = express.Router();
const cache_query = require("../module/mysql_cache");

function getMaintainInfo(limit = undefined) {
	return cache_query(`select * from maintain_info ${limit ? "limit 1" : ""}`);
}

router.get("/", async (req, res) => {
	res.json({
		status: "OK",
		data: await getMaintainInfo()
	});
});

router.get("/", async (req, res) => {
	res.json({
		status: "OK",
		data: await getMaintainInfo(true)
	});
});

module.exports = ["/update_log", router];
