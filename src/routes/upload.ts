/* eslint-disable no-console */
import express, { Request, Response } from "express";
const router = express.Router();
import multer from "multer";
import Bluebird from "bluebird";
const fsPromise = Bluebird.promisifyAll(require("fs"));
const query = require("../module/mysql_query");
const config = global.config;
const path = require("path");
import auth from "../middleware/auth";
const { checkCaptcha } = require("../module/captcha_checker");
const [error] = require("../module/const_var");
import ProblemManageService from "../service/ProblemManageService";

let upload: any = false;
try {
	upload = multer({ dest: config.problem_upload_dest.dir });
} catch (e) {
	console.error("Your upload directory in your config.json is invalid.Please modify it to a valid path.\nError message:", e);
}

const createProblemModule = (req: any, res: Response) => {
	const fpath = req.file.path;
	const pid = req.body.pid ? parseInt(req.body.pid) : undefined;

	ProblemManageService.importProblemFromRPK(req, fpath, pid)
		.then(problem_list => {
			res.json({
				status: "OK",
				data: problem_list
			});
		})
		.catch((err: any) => {
			console.log(err);
			res.json(error.errorMaker("upload file error"));
		});
};

if (upload !== false) {
	router.post("/", upload.single("fps"), (req: any, res: any) => {
		createProblemModule(req, res);
	});

	router.post("/user", upload.single("fps"), (req: any, res: any) => {
		if (!checkCaptcha(req, "upload")) {
			res.json(error.invalidCaptcha);
		} else {
			createProblemModule(req, res);
		}
	});
}

router.get("/", async (req: any, res: any) => {
	const problem_dir = "/home/upload_problems";
	try {
		const dir_list = await fsPromise.readdirAsync(problem_dir);
		let file_list: string[] = [];
		dir_list.forEach((el: any) => {
			if (el.match(/\.rpk/)) {
				file_list.push(el);
			}
		});
		dir_list.sort();
		const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
		let max_pid = parseInt(_max_pid[0].max_id);
		let problem_lists: any[] = [];
		let start_id = max_pid + 1;

		for (let el of file_list) {
			const filename = path.join(problem_dir, el);
			// using Service for parsing and creating
			const problem_list = await ProblemManageService.importProblemFromRPK(req, filename, start_id);
			start_id += problem_list.length; // importProblemFromRPK returns list of created problems
			await fsPromise.unlinkAsync(filename);
			problem_lists.push(problem_list);
		}
		res.json({
			status: "OK",
			data: problem_lists
		});
	} catch (e) {
		console.log(e);
		res.json(error.errorMaker("batch upload error or directory not found"));
	}
});

export = ["/upload", auth, router];
