import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");
const getIP = require("../../module/getIP");
import auth from "../../middleware/auth";
router.get("/", (req: any, res: any) => {
	try {
		res.json({
			status: "OK",
			ip: getIP(req)
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.errorMaker("internal error"));
	}
});

module.exports = ["/ip", auth, router];
