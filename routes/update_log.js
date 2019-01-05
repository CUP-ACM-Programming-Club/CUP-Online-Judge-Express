const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");

function getMaintainInfo(limit = undefined) {
	return cache_query(`select * from maintain_info order by mtime desc ${limit ? "limit 1" : ""}`);
}

router.get("/", async (req, res) => {
	res.json({
		status: "OK",
		data: await getMaintainInfo()
	});
});


router.get("/latest", async (req, res) => {
	res.json({
		status: "OK",
		data: await getMaintainInfo(true)
	});
});

module.exports = ["/update_log", auth, router];
