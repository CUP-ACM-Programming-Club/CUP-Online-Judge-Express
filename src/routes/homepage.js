const express = require("express");
const router = express.Router();
router.get("/", function (req, res) {
	res.render("homepage", {title: "CUP Online Judge", OJ_NAME: "CUP Online Judge"});
});

module.exports = ["/homepage", router];
