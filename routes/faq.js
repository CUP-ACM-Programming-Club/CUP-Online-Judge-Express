const express = require("express");
const router = express.Router();
router.get("/", (req, res) => {
	res.render("faq", {title: "CUP Online Judge FAQ"});
});

module.exports = router;