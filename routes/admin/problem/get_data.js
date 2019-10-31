const express = require("express");
const router = express.Router();
const ProblemFileManager = require("../../../module/problem/ProblemFileManager");

router.get("/data/:problemId/:fileName", (req, res) => {
	const {problemId, fileName} = req.params;
	const filePath = ProblemFileManager.getFilePath(problemId, fileName);
	res.download(filePath);
});

module.exports = ["/download", router];
