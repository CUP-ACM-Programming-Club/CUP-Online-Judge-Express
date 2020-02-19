import express from "express";
const router = express.Router();
import ProblemFileManager from "../../../module/problem/ProblemFileManager";

router.get("/data/:problemId/:fileName", (req, res) => {
	const {problemId, fileName} = req.params;
	const filePath = ProblemFileManager.getFilePath(problemId, fileName);
	res.download(filePath);
});

export = ["/download", router];
