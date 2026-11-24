import express from "express";
import ContestAssistantManager from "../../../../../infrastructure/persistence/contest/ContestAssistantManager";
const router = express.Router();
const admin = require("../../../middleware/admin");

// 字面路径必须注册在 /:topicId 之前，否则 POST /remove 会被当成 topicId="remove" 去“添加专题助教”
router.post("/remove", async (req, res) => {
    res.json(await ContestAssistantManager.removeContestAssistantByRequest(req));
});

router.post("/:topicId", async (req, res) => {
    res.json(await ContestAssistantManager.setContestAssistantByTopicByRequest(req));
});

router.post("/", async (req, res) => {
    res.json(await ContestAssistantManager.setContestAssistantByRequest(req));
});

router.get("/all", async (req, res) => {
    res.json(await ContestAssistantManager.getAllContestAssistantsByRequest(req));
});

router.get("/:contestId", async (req, res) => {
    res.json(await ContestAssistantManager.getContestAssistantsByRequest(req));
});

export = ["/assistant", admin, router];
