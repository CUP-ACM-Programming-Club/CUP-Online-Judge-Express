import express, { Router } from "express";
import TutorialController from "../../controllers/TutorialController";
const router: Router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await TutorialController.getTutorialListByUserId(req.params.user_id));
});

export default router;
