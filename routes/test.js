const express = require("express");
const router = express.Router();
//const cryptoJS = require("crypto-js");
//const crypto = require("crypto");
//const query = require("../module/mysql_query");
router.get("/", function (req, res) {
	const obj = {
		list: [
			"a", "b", "c", "d"
		]
	};
	res.render("test", obj);
});

module.exports = router;