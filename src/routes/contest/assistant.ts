import express from "express";
import ContestAssistantManager from "../../manager/contest/ContestAssistantManager";
const router = express.Router();

router.get("/:contest_id", async (req, res) => {
    res.json(await ContestAssistantManager.userIsContestAssistantByRequest(req));
});

export = ["/assistant", router];
