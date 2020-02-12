import express, {Router} from "express";
import ContestSetManager from "../../manager/contestset/ContestSetManager";
const router: Router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetManager.getContestSetByContestSetIdByRequest(req));
});

router.get("/", async (req, res) => {
    res.json(await ContestSetManager.getContestSetByRequest(req));
});

export = ["/set", router];
