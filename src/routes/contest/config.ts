import express from "express";
import ContestInfoManager from "../../module/contest/ContestInfoManager";
const router = express.Router();

router.get("/:contestId", async (req, res) => {
    res.json(await ContestInfoManager.getConfigByRequest(req));
});

export = ["/config", router];
