/* eslint-disable no-console */
import express, { Request, Response } from "express";
const router = express.Router();
import multer from "multer";
import Bluebird from "bluebird";
const fsPromise = Bluebird.promisifyAll(require("fs"));
const fs = require("fs");
const zlib = require("zlib");
const rimraf = require("rimraf");
const query = require("../module/mysql_query");
const config = global.config;
const D2UConverter = require("dos2unix").dos2unix;
const d2u: any = new D2UConverter({ glob: { cwd: __dirname } })
	.on("error", function (err: any) {
		console.error(err);
	})
	.on("end", function (stats: any) {
		console.log(stats);
	});
let upload: any = false;
try {
	upload = multer({ dest: config.problem_upload_dest.dir });
} catch (e) {
	console.error("Your upload directory in your config.json is invalid.Please modify it to a valid path.\nError message:", e);
}
const path = require("path");
const auth = require("../middleware/auth");
const { checkCaptcha } = require("../module/captcha_checker");
const [error] = require("../module/const_var");
const jschardet = require("jschardet");
const iconv = require("iconv-lite");
const stripBom = require("strip-bom");


const base64ToString = (base64: string) => {
	let data: any = Buffer.from(base64, "base64");
	if (jschardet.detect(data).encoding === "GB2312") {
		data = iconv.decode(data, "gb2312");
	}
	return stripBom(data.toString());
};

const convertLanguage = (language_name: string) => {
	const language_file_name: any = {
		".c": [0, 13, 21],
		".cpp": [1, 14, 19, 20],
		".cc": [1, 14, 19, 20],
		".java": [3, 23, 24, 27],
		".py": [17, 18],
		".js": [16],
		".lua": [15]
	};
	for (let i in language_file_name) {
		if (path.extname(language_name) === i) {
			return language_file_name[i];
		}
	}
	return [19];
};

interface Problem {
	title: string;
	description: string;
	input: string;
	output: string;
	sample_input: string;
	sample_output: string;
	spj: number;
	hint: string;
	source: string;
	label: string | string[];
	in_date: string;
	time: number;
	memory: number;
	defunct: string;
	accepted: number;
	submit: number;
	solved: number;
	special_judge?: any;
	input_files?: any[];
	output_files?: any[];
	prepend_files?: any[];
	append_files?: any[];
	solution?: any[];
}

const make_problem = async (problem_id: number, problems: any = {}, req: any) => {
	const save_problem = Object.assign({
		title: "",
		description: "",
		input: "",
		output: "",
		sample_input: "",
		sample_output: "",
		spj: 0,
		hint: "",
		source: "",
		label: "",
		in_date: "",
		time: 0,
		memory: 0,
		defunct: "N",
		accepted: 0,
		submit: 0,
		solved: 0
	}, problems);
	try {
		await query(`INSERT INTO problem (problem_id,title,description,input,output,
		sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
		defunct,accepted,submit,solved)
		VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
		`, [problem_id, save_problem.title, save_problem.description, save_problem.input,
			save_problem.output, save_problem.sample_input, save_problem.sample_output,
			Number(Boolean(save_problem.special_judge && save_problem.special_judge.length > 0)),
			save_problem.hint, save_problem.source, Array.isArray(save_problem.label) ? save_problem.label.join(" ") : save_problem.label, save_problem.time,
			save_problem.memory, save_problem.defunct, 0, 0, 0]);
		await query("DELETE FROM privilege where rightstr = ?", [`p${problem_id}`]);
		await query("INSERT INTO privilege (user_id,rightstr,defunct) values(?,?,?)", [req.session.user_id, `p${problem_id}`, "N"]);
		req.session.problem_maker[`p${problem_id}`] = true;

	}
	catch (e) {
		console.log(e);
	}
};

const writeFiles = async (_path: string, files: any[]) => {
	try {
		for (let i of files) {
			if (!i || !i.name || !i.content) {
				continue;
			}
			const name = i.name;
			const data = base64ToString(i.content);
			await fsPromise.writeFileAsync(path.join(_path, name), data);
			await fsPromise.chownAsync(path.join(_path, name), 48, 48);
		}
	}
	catch (e) {
		console.log(e);
	}
};

const submitProblem = async (req: any, pid: number, files: any[], prepend: any[] = [], append: any[] = []) => {
	for (let i of files) {
		const content = Buffer.from(i.content, "base64").toString();
		const language = JSON.stringify(convertLanguage(i.name));
		let prepend_code = prepend.find((el) => JSON.stringify(convertLanguage(el.name)) === language) || "";
		let append_code = append.find((el) => JSON.stringify(convertLanguage(el.name)) === language) || "";
		if (prepend_code !== "") {
			prepend_code = base64ToString(prepend_code.content);
		}
		if (append_code !== "") {
			append_code = base64ToString(append_code.content);
		}
		const rows = await query(`INSERT INTO solution(problem_id,language,user_id,in_date,code_length,ip)
		VALUES(?,?,?,NOW(),?,'127.0.0.1')`, [pid, convertLanguage(i.name)[0], req.session.user_id, content.length]);
		const solution_id = rows.insertId;
		query(`INSERT INTO source_code(solution_id,source)VALUES(?,'${prepend_code + content + append_code}')`
			, [solution_id]);
		query(`INSERT INTO source_code_user(solution_id,source)VALUES(?,'${content}')`, [solution_id]);
	}
};

const make_files = async (req: any, pid: number, problems: any = {}) => {
	const inputFiles = problems.input_files;
	const outputFiles = problems.output_files;
	const prependFiles = problems.prepend_files || [];
	const appendFiles = problems.append_files || [];
	const special_judge = [problems.special_judge];
	const solutionFiles = problems.solution;
	const save_path = path.join("/home/judge/data", pid.toString());
	if (fs.existsSync(save_path)) {
		// @ts-ignore
		await Bluebird.promisify(rimraf)(save_path);
	}
	await fsPromise.mkdirAsync(save_path, 0o755);
	await writeFiles(save_path, inputFiles);
	await writeFiles(save_path, outputFiles);
	(d2u as any).process([`${save_path}/*`]);
	await writeFiles(save_path, special_judge);
	const special_judge_file = special_judge[0];

	if (special_judge_file && special_judge_file.name) {
		let suffix = special_judge_file.name.substring(special_judge_file.name.indexOf(".") + 1);
		if (suffix === "cc" || suffix === "c" || suffix === "cpp") {
			// check administrator privilege
		}
	}
	for (let i of prependFiles) {
		const languageSet = convertLanguage(i.name);
		for (let lang of languageSet) {
			query("insert into prefile (problem_id,prepend,code,type) VALUES(?,?,?,?)", [pid, 1, base64ToString(i.content), lang]);
		}
	}

	for (let i of appendFiles) {
		const languageSet = convertLanguage(i.name);
		for (let lang of languageSet) {
			query("insert into prefile (problem_id,prepend,code,type) VALUES(?,?,?,?)", [pid, 0, base64ToString(i.content), lang]);
		}
	}
	await fsPromise.chownAsync(save_path, 48, 48);
	await submitProblem(req, pid, solutionFiles, prependFiles, appendFiles);
};

const make_file = async (req: any, res: any, file_path?: string, pid?: number) => {
	const fpath = file_path || req.file.path;
	const data = await fsPromise.readFileAsync(fpath);
	// @ts-ignore
	const unzip_data = (await Bluebird.promisify(zlib.gunzip as any)(data)).toString();
	const problems = JSON.parse(unzip_data);
	let max_pid;

	if (pid) {
		max_pid = pid;
	} else {
		const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
		max_pid = parseInt(_max_pid[0].max_id);
	}
	let problem_list = [];
	for (let i = 0; i < problems.length; ++i) {
		await make_problem(max_pid + i + 1, problems[i], req);
		await make_files(req, max_pid + i + 1, problems[i]);
		problem_list.push({
			problem_id: max_pid + i + 1,
			title: problems[i].title
		});
	}
	return problem_list;
};

const createProblemModule = (req: Request, res: Response) => {
	make_file(req, res)
		.then(problem_list => {
			res.json({
				status: "OK",
				data: problem_list
			});
		})
		.catch((err) => {
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

router.get("/", async (req, res) => {
	const problem_dir = "/home/upload_problems";
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
		const problem_list = await make_file(req, res, filename, start_id++);
		await fsPromise.unlinkAsync(filename);
		problem_lists.push(problem_list);
	}
	res.json({
		status: "OK",
		data: problem_lists
	});
});

export = ["/upload", auth, router];
