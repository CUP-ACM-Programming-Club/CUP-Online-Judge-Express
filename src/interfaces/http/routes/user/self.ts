import SelfInfoController from "../../controllers/SelfInfoController";
import express from "express";
const router = express.Router();
router.get("/", (req, res) => {
	res.json(SelfInfoController.getSelfInfoByRequest(req));
});

export default router;
