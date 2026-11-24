import express, {Router} from "express";
import ContestSetManager from "../../../../infrastructure/persistence/contestset/ContestSetManager";
import ContestSetListManager from "../../../../infrastructure/persistence/contestset/ContestSetListManager";
const router: Router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetListManager.getContestSetListByRequest(req));
});

export = ["/list", router];
