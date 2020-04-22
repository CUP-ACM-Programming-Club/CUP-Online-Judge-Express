import SelfInfoManager from "../../manager/user/SelfInfoManager";
import express from "express";
const router = express.Router();
router.get("/", (req, res) => {
	res.json(SelfInfoManager.getSelfInfo(req));
});

export =  ["/self", router];
