import express from "express";
import LoginLogController from "../../controllers/LoginLogController";
const router = express.Router();
router.post("/", async (req, res) => {
	res.json(await LoginLogController.setUserIdLoginLog(req));
});

export = ["/client", router];
