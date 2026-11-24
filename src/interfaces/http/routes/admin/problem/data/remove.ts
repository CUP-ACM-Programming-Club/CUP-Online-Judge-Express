import express, {Router} from "express";
import ProblemDataController from "../../../../controllers/ProblemDataController";
const router: Router = express.Router();

router.get("/:problemId/:fileName", async (req, res) => {
    res.json(await ProblemDataController.removeFile(req));
});

export = ["/remove", router];
