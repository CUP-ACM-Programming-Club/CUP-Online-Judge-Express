import express, {Router} from "express";
import SolutionController from "../../controllers/SolutionController";
const router: Router = express.Router();
router.get("/:solutionId", async (req, res) => {
    res.json(await SolutionController.getSolutionInfoByRequest(req));
});

export = ["/info", router];
