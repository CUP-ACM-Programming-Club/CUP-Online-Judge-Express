import express, {Router} from "express";
import TutorialManager from "../../manager/problem/TutorialManager";
const router: Router = express.Router();

router.get("/:user_id", async (req, res) => {
    res.json(await TutorialManager.getTutorialListByUserId(req.params.user_id));
});

export = ["/tutorial", router];
