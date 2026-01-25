import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const { error, ok } = require("../module/constants/state");
import ProblemFileManager from "../module/problem/ProblemFileManager";

function isSpjFile(file_name: string) {
	return file_name.indexOf(".") === file_name.lastIndexOf(".") && file_name.indexOf("spj") === 0 && file_name.substring(3).indexOf(".") === 0;
}

router.get("/:problem_id", async (req, res) => {
	try {
		const problem_id = parseInt(req.params.problem_id);
		if (isNaN(problem_id)) {
			res.json(error.invalidProblemID);
			return;
		}
		const problem_path = ProblemFileManager.getProblemPath(problem_id);
		const dirFile = await fs.readdirAsync(problem_path);
		let validFile = [];
		for (let file of dirFile) {
			if (file === "ac") {
				continue;
			}
			if (file.endsWith(".in")) {
				validFile.push(file);
			} else if (file.endsWith(".out")) {
				validFile.push(file);
			} else if (isSpjFile(file)) {
				validFile.push(file);
			}
		}
		res.json(ok.okMaker(validFile));
	} catch (e) {
		console.log(e);
		res.json(error.errorMaker(e));
	}
});

module.exports = ["/file", auth, router];
