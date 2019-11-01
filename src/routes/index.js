const express = require("express");
const router = express.Router();
router.get("/", function (req, res) {
	res.render("index", {title: "CUP Online Judge", header: "API"});
});

module.exports = ["/", router];
