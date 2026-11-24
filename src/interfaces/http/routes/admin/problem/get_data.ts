import express from "express";
const router = express.Router();
import AdminProblemService from "../../../../../application/services/admin/AdminProblemService";

router.get("/data/:problemId/:fileName", (req, res) => {
	const { problemId, fileName } = req.params;
	const filePath = AdminProblemService.getProblemDataPath(parseInt(problemId), fileName);
	res.download(filePath);
});

export = ["/download", router];
