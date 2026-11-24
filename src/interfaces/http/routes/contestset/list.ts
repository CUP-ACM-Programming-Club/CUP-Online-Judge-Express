import express, {Router} from "express";
import ContestSetController from "../../controllers/ContestSetController";
const router: Router = express.Router();

router.get("/:contestSetId", async (req, res) => {
    res.json(await ContestSetController.getContestSetList(req));
});

export = ["/list", router];
