import express from "express";
const router = express.Router();
import auth from "../middleware/auth";


import MaintainService from "../service/MaintainService";

router.get("/", auth, async (req, res) => {
	res.json({
		status: "OK",
		data: await MaintainService.getMaintainInfo()
	});
});

router.get("/latest", async (req, res) => {
	res.json({
		status: "OK",
		data: await MaintainService.getMaintainInfo(true)
	});
});

export = ["/update_log", router];
