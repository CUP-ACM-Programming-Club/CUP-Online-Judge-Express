import SelfInfoManager from "../../manager/user/SelfInfoManager";

const express = require("express");
const router = express.Router();
router.get("/", (req, res) => {
	res.json(SelfInfoManager.getSelfInfo(req));
});

module.exports = ["/self", router];
