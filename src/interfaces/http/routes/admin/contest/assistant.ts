import express from "express";
import ContestAssistantController from "../../../controllers/ContestAssistantController";
const router = express.Router();
const admin = require("../../../middleware/admin");

// 字面路径必须注册在 /:topicId 之前，否则 POST /remove 会被当成 topicId="remove" 去“添加专题助教”
router.post("/remove", async (req, res) => {
    res.json(await ContestAssistantController.removeContestAssistant(req));
});

router.post("/:topicId", async (req, res) => {
    res.json(await ContestAssistantController.setContestAssistantByTopic(req));
});

router.post("/", async (req, res) => {
    res.json(await ContestAssistantController.setContestAssistant(req));
});

router.get("/all", async (req, res) => {
    res.json(await ContestAssistantController.getAllContestAssistants(req));
});

router.get("/:contestId", async (req, res) => {
    res.json(await ContestAssistantController.getContestAssistants(req));
});

export = ["/assistant", admin, router];
