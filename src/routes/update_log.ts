import express from "express";
const router = express.Router();
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");

function getMaintainInfo(limit = false) {
	return cache_query(`select * from maintain_info order by mtime desc ${limit ? "limit 1" : ""}`);
}

router.get("/", auth, async (req, res) => {
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

export = ["/update_log", router];
