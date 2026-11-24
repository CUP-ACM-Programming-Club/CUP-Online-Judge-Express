import express, {Router} from "express";
const router: Router = express.Router();
import ProblemFileManager from "../../../../../../infrastructure/storage/ProblemFileManager";

router.get("/:problemId/:fileName", (req, res) => {
    const {problemId, fileName} = req.params;
    const filePath = ProblemFileManager.getFilePath(problemId, fileName);
    res.download(filePath);
});

export = ["/get", router];
