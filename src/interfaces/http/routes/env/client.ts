import express from "express";
import LoginLogManager from "../../../../infrastructure/persistence/user/record/LoginLogManager";
const router = express.Router();
router.post("/", async (req, res) => {
	res.json(await LoginLogManager.setUserIdLoginLogByRequest(req));
});

export = ["/client", router];
