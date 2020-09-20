import express from "express";
import ContestAssistantManager from "../../../manager/contest/ContestAssistantManager";
const router = express.Router();
const admin = require("../../../middleware/admin");

router.post("/:topicId", async (req, res) => {
    res.json(await ContestAssistantManager.setContestAssistantByTopicByRequest(req));
});

router.post("/", async (req, res) => {
    res.json(await ContestAssistantManager.setContestAssistantByRequest(req));
});

router.post("/remove", async (req, res) => {
    res.json(await ContestAssistantManager.removeContestAssistantByRequest(req));
});

router.get("/all", async (req, res) => {
    res.json(await ContestAssistantManager.getAllContestAssistantsByRequest(req));
});

router.get("/:contestId", async (req, res) => {
    res.json(await ContestAssistantManager.getContestAssistantsByRequest(req));
});

export = ["/assistant", admin, router];
