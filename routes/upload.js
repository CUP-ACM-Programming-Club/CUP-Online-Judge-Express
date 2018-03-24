const express = require("express");
const router = express.Router();
const multer = require("multer");
const Promise = require("bluebird");
const fsPromise = Promise.promisifyAll(require("fs"));
const fs = require("fs");
const zlib = require("zlib");
const rimraf = require("rimraf");
const query = require("../module/mysql_query");
const upload = multer({dest: "/home/uploads/"});
const path = require("path");
const convertLanguage = (language_name) => {
	const language_file_name = {
		".c": 21,
		".cpp": 19,
		".cc": 19,
		".java": 3,
		".py": 18,
	};
	for (let i in language_file_name) {
		if (/*language_name.indexOf(i) !== -1*/path.extname(language_name) === i) {
			return language_file_name[i];
		}
	}
	return 19;
};
const make_problem = (problem_id, problems = {}) => {
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
			save_problem.hint, save_problem.source, save_problem.label.join(" "), save_problem.time,
			save_problem.memory, save_problem.defunct, 0, 0, 0])

			.then(rows => {
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
		const data = new Buffer(i.content, "base64").toString();
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

const submitProblem = async (req, pid, files) => {
	for (let i of files) {
		const content = new Buffer(i.content, "base64").toString();
		await new Promise((resolve, reject) => {
			query(`INSERT INTO solution(problem_id,language,user_id,in_date,code_length,ip)
		VALUES(?,?,?,NOW(),?,'127.0.0.1')`, [pid, convertLanguage(i.name), req.session.user_id, content.length])
				.then(rows => {
					const solution_id = rows.insertId;
					query(`INSERT INTO source_code(solution_id,source)VALUES(?,'${content}')`
						, [solution_id])
						.then(rows => {
							resolve(rows);
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
	const solutionFiles = problems.solution;
	const save_path = path.join("/home/judge/data", pid.toString());
	await new Promise(async (resolve, reject) => {
		if (fs.existsSync(save_path)) {
			await new Promise(resolve=>{
				rimraf(save_path,()=>{resolve();});
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
	await writeFiles(save_path, prependFiles);
	await writeFiles(save_path, appendFiles);
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
	await submitProblem(req, pid, solutionFiles);
};

router.post("/", upload.single("fps"), async (req, res) => {
	const data = await fsPromise.readFileAsync(req.file.path);
	const unzip_data = await new Promise((resolve) => {
		zlib.gunzip(data, (err, data) => {
			resolve(data.toString());
		});
	});
	const problems = JSON.parse(unzip_data);
	const _max_pid = await query("SELECT max(problem_id) as max_id FROM problem");
	let max_pid = parseInt(_max_pid[0].max_id);
	let problem_list = [];
	for (let i = 0; i < problems.length; ++i) {
		await make_problem(max_pid + i + 1, problems[i]);
		await make_files(req, max_pid + i + 1, problems[i]);
		problem_list.push({
			problem_id:max_pid + i + 1,
			title:problems[i].title
		});
	}
	res.json({
		status: "OK",
		data:problem_list
	});
});

module.exports = router;