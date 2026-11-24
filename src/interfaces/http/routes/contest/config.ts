import express from "express";
import ContestInfoManager from "../../controllers/ContestConfigController";
const router = express.Router();

router.get("/:contestId", async (req, res) => {
    res.json(await ContestInfoManager.getConfigByRequest(req));
});

export = ["/config", router];
