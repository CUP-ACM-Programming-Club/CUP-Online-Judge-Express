/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Promise = require("bluebird");
const fsPromise = Promise.promisifyAll(require("fs"));
const fs = require("fs");
const zlib = require("zlib");
const rimraf = require("rimraf");
const query = require("../module/mysql_query");
const config = require("../config.json");
const upload = multer({dest: config.problem_upload_dest.dir});
const path = require("path");
const auth = require("../middleware/auth");
const {checkCaptcha} = require("../module/captcha_checker");
const [error] = require("../module/const_var");

const base64ToString = (base64) => {
	return new Buffer(base64, "base64").toString();
};

const convertLanguage = (language_name) => {
	const language_file_name = {
		".c": [0, 13, 21],
		".cpp": [1, 14, 19, 20],
		".cc": [1, 14, 19, 20],
		".java": [3, 23, 24, 27],
		".py": [17, 18],
		".js": [16],
		".lua": [15]
	};
	for (let i in language_file_name) {
		if (/*language_name.indexOf(i) !== -1*/path.extname(language_name) === i) {
			return language_file_name[i];
		}
	}
	return [19];
};
const make_problem = (problem_id, problems = {}, req) => {
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
	return new Promise((resolve, reject) => {
		query(`INSERT INTO problem (problem_id,title,description,input,output,
		sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
		defunct,accepted,submit,solved)
		VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
		`, [problem_id, save_problem.title, save_problem.description, save_problem.input,
			save_problem.output, save_problem.sample_input, save_problem.sample_output,
			Number(Boolean(save_problem.special_judge && save_problem.special_judge.length > 0)),
			save_problem.hint, save_problem.source, save_problem.label.length > 0 ? save_problem.label.join(" ") : "", save_problem.time,
			save_problem.memory, save_problem.defunct, 0, 0, 0])

			.then(rows => {
				query("INSERT INTO privilege (user_id,rightstr,defunct) values(?,?,?)", [req.session.user_id, `p${problem_id}`, "N"]);
				resolve(rows);
			})
			.catch(err => {
				reject(err);
			});
		resolve();
	});
};

const writeFiles = async (_path, files) => {
	for (let i of files) {
		const name = i.name;
		const data = base64ToString(i.content);
		await new Promise((resolve, reject) => {
			fs.writeFile(path.join(_path, name), data, function (err) {
				if (err) {
					reject(err);
				}
				else {
					fs.chown(path.join(_path, name), 48, 48, function (err) {
						if (err) {
							throw err;
						}
					});
					resolve();
				}
			});
		});
	}
};

const submitProblem = async (req, pid, files, prepend = [], append = []) => {
	for (let i of files) {
		const content = new Buffer(i.content, "base64").toString();
		const language = JSON.stringify(convertLanguage(i.name));
		let prepend_code = prepend.find((el) => JSON.stringify(convertLanguage(el.name)) === language) || "";
		let append_code = append.find((el) => JSON.stringify(convertLanguage(el.name)) === language) || "";
		if (prepend_code !== "") {
			prepend_code = base64ToString(prepend_code.content);
		}
		if (append_code !== "") {
			append_code = base64ToString(append_code.content);
		}
		await new Promise((resolve, reject) => {
			query(`INSERT INTO solution(problem_id,language,user_id,in_date,code_length,ip)
		VALUES(?,?,?,NOW(),?,'127.0.0.1')`, [pid, convertLanguage(i.name)[0], req.session.user_id, content.length])
				.then(rows => {
					let flag = 0;
					let feedback = [];
					const check = (row) => {
						if (row) {
							feedback.push(row);
						}
						if (++flag > 1) resolve();
					};
					const solution_id = rows.insertId;
					query(`INSERT INTO source_code(solution_id,source)VALUES(?,'${prepend_code + content + append_code}')`
						, [solution_id])
						.then(rows => {
							check(rows);
						})
						.catch(err => {
							reject(err);
						});
					query(`INSERT INTO source_code_user(solution_id,source)VALUES(?,'${content}')`, [solution_id])
						.then(rows => {
							check(rows);
						})
						.catch(err => {
							reject(err);
						});
				})
				.catch(err => {
					reject(err);
				});
		});
	}
};

const make_files = async (req, pid, problems = {}) => {
	const inputFiles = problems.input_files;
	const outputFiles = problems.output_files;
	const prependFiles = problems.prepend_files;
	const appendFiles = problems.append_files;
	// const sample_input = problems.sample_input;
	// const sample_output = problems.sample_output;
	const solutionFiles = problems.solution;
	const save_path = path.join("/home/judge/data", pid.toString());
	await new Promise(async (resolve, reject) => {
		if (fs.existsSync(save_path)) {
			await new Promise(resolve => {
				rimraf(save_path, () => {
					resolve();
				});
			});
		}
		fs.mkdir(save_path, 0o755, function (err) {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});
	await writeFiles(save_path, inputFiles);
	await writeFiles(save_path, outputFiles);
	// sample maybe have wrong data
	// await writeFiles(save_path, [{name: "sample.in", content: Buffer.from(sample_input).toString("base64")}]);
	// await writeFiles(save_path, [{name: "sample.out", content: Buffer.from(sample_output).toString("base64")}]);
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
	// await writeFiles(save_path, prependFiles);
	// await writeFiles(save_path, appendFiles);
	await new Promise((resolve, reject) => {
		fs.chown(save_path, 48, 48, function (err) {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});
	await submitProblem(req, pid, solutionFiles, prependFiles, appendFiles);
};

const make_file = async (req, res, file_path, pid) => {
	const fpath = file_path || req.file.path;
	const data = await fsPromise.readFileAsync(fpath);
	const unzip_data = await new Promise((resolve) => {
		zlib.gunzip(data, (err, data) => {
			resolve(data.toString());
		});
	});
	const problems = JSON.parse(unzip_data);
	let max_pid;

	if (pid) {
		max_pid = pid;
	}
	else {
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

const createProblemModule = (req, res) => {
	make_file(req, res)
		.then(problem_list => {
			res.json({
				status: "OK",
				data: problem_list
			});
		})
		.catch(() => {
			res.json({
				status: "ERROR",
				statement: "upload file error"
			});
		});
};

router.post("/", upload.single("fps"), (req, res) => {
	createProblemModule(req, res);
});

router.post("/user", upload.single("fps"), (req, res) => {
	if (!checkCaptcha(req, "upload")) {
		res.json(error.invalidCaptcha);
	}
	else {
		createProblemModule(req, res);
	}
});

router.get("/", async (req, res) => {
	const problem_dir = "/home/upload_problems";
	const dir_list = await new Promise((resolve, reject) => {
		fs.readdir(problem_dir, (err, data) => {
			if (err) {
				reject();
			}
			resolve(data);
		});
	});
	let file_list = [];
	dir_list.forEach((el) => {
		if (el.match(/\.rpk/)) {
			file_list.push(el);
		}
	});
	dir_list.sort();
	const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
	let max_pid = parseInt(_max_pid[0].max_id);
	let problem_lists = [];
	let start_id = max_pid + 1;
	for (let el of file_list) {
		const filename = path.join(problem_dir, el);
		const problem_list = await make_file(req, res, filename, start_id++);
		await new Promise(resolve => {
			fs.unlink(filename, () => {
				resolve();
			});
		});
		problem_lists.push(problem_list);
	}
	res.json({
		status: "OK",
		data: problem_lists
	});
});

module.exports = ["/upload", auth, router];
