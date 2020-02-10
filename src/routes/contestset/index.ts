import express, {Router} from "express";
import ContestSetManager from "../../manager/contestset/ContestSetManager";
import ContestSetListManager from "../../manager/contestset/ContestSetListManager";
const router: Router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetListManager.getContestSetListByRequest(req));
});

router.get("/", async (req, res) => {
    res.json(await ContestSetManager.getContestSetByRequest(req));
});

export = ["/list", router];
