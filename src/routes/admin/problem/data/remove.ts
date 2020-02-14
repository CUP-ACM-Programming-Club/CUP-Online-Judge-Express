import express, {Router} from "express";
import ProblemFileManager from "../../../../module/problem/ProblemFileManager";
const router: Router = express.Router();

router.get("/:problemId/:fileName", async (req, res) => {
    res.json(await ProblemFileManager.removeFileByRequest(req));
});

export = ["/remove", router];
