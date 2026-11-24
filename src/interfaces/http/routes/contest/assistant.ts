import express from "express";
import ContestAssistantController from "../../controllers/ContestAssistantController";
const router = express.Router();

router.get("/:contest_id", async (req, res) => {
    res.json(await ContestAssistantController.userIsContestAssistant(req));
});

export = ["/assistant", router];
