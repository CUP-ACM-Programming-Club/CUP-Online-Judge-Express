import express, {Router} from "express";
const router: Router = express.Router();
import ProblemDataUseCases from "../../../../../../application/problem/ProblemDataUseCases";

router.get("/:problemId/:fileName", (req, res) => {
    const {problemId, fileName} = req.params;
    const filePath = ProblemDataUseCases.getFilePath(problemId, fileName);
    res.download(filePath);
});

export = ["/get", router];
