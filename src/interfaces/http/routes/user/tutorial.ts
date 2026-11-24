import express, { Router } from "express";
import TutorialManager from "../../../../infrastructure/persistence/problem/TutorialManager";
const router: Router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await TutorialManager.getTutorialListByUserId(req.params.user_id));
});

export default router;
