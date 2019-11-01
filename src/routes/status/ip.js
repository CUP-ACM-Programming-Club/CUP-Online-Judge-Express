const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const getIP = require("../../module/getIP");
const auth = require("../../middleware/auth");
router.get("/", (req,res) => {
	try {
		res.json({
			status: "OK",
			ip:getIP(req)
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.errorMaker("internal error"));
	}
});

module.exports = ["/ip", auth, router];
