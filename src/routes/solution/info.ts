import express, {Router} from "express";
import SolutionManager from "../../manager/submission/SolutionManager";
const router: Router = express.Router();
router.get("/:solutionId", async (req, res) => {
    res.json(await SolutionManager.getSolutionInfoByRequest(req));
});

export = ["/info", router];
