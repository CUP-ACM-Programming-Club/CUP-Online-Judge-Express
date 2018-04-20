/* eslint-disable no-console */
const promise = require("bluebird");
const fs = promise.promisifyAll(require("fs"));
const router = require("express").Router();
const path = require("path");
const query = require("../module/mysql_cache");
// const suffix = require("../module/const_name").language_suffix.local;
const zlib = require("zlib");
const home_dir = path.join(require("../config.json").judger.oj_home, "data");
const middleWare = require("../middleware/admin");

const error_cb = {
	status: "ERROR",
	statement: "No such problem_id or contest_id"
};

const readDir = async (dir) => {
	let _dir = {
		input: [],
		output: [],
		spj: "",
		prepend: [],
		append: [],
		solution: []
	};
	const fileList = await new Promise((resolve, reject) => {
		fs.readdir(dir, (err, res) => {
			if (err) {
				reject(err);
			}
			resolve(res);
		});
	});
	fileList.forEach((name) => {
		if (name.match(/\.in$/)) {
			_dir.input.push(path.join(dir, name));
		}
		else if (name.match(/\.out$/)) {
			_dir.output.push(path.join(dir, name));
		}
		else if (name.match(/^prepend/)) {
			_dir.prepend.push(path.join(dir, name));
		}
		else if (name.match(/^append/)) {
			_dir.append.push(path.join(dir, name));
		}
		else if (name.match(/^spj.[\s\S]+/)) {
			_dir.spj = path.join(dir, name);
		}
	});
	return _dir;
};

const readFile = async (file_list) => {
	let target = [];
	for (let i of file_list) {
		if (typeof i === "string" && i.length > 0) {
			try {
				const content = await fs.readFileAsync(i);
				const name = path.basename(i);
				target.push({
					name: name,
					content: content.toString("base64")
				});
			}
			catch (e) {
				console.log(e);
				console.log(i);
			}
		}
	}
	return target;
};

const pack_problem = async (_problem_detail, problem_dir) => {
	const problem_details = {
		title: _problem_detail.title,
		time: _problem_detail.time_limit,
		memory: _problem_detail.memory_limit,
		label: _problem_detail.label ? _problem_detail.label.split(" ") : [],
		description: _problem_detail.description,
		input: _problem_detail.input,
		output: _problem_detail.output,
		sample_input: _problem_detail.sample_input,
		sample_output: _problem_detail.sample_output,
		hint: _problem_detail.hint,
		input_files: [],
		output_files: [],
		prepend: [],
		append: [],
		spj: "",
		solution: [],
	};

	const dirFileList = await readDir(problem_dir);
	problem_details.input_files = await readFile(dirFileList.input);
	problem_details.output_files = await readFile(dirFileList.output);
	problem_details.prepend = await readFile(dirFileList.prepend);
	problem_details.append = await readFile(dirFileList.append);
	problem_details.spj = await readFile([dirFileList.spj])[0];
	return problem_details;
};

const send_file = (req, res, data, filename) => {
	zlib.gzip(JSON.stringify(data), (err, result) => {
		if (err) {
			res.json(err);
			return;
		}
		res.writeHead(200, {
			"Content-Type": "application/rpk",
			"Content-disposition": "attachment;filename=" + filename + ".rpk",
			"Content-Length": result.length
		});
		res.end(new Buffer(result, "binary"));
	});
};

const pack_file = async (req, res, opt = {}) => {
	if ((typeof opt.problem_id === "undefined" && typeof opt.contest_id === "undefined") || (isNaN(opt.problem_id) && isNaN(opt.contest_id))) {
		res.json(error_cb);
		return;
	}
	else {
		if (typeof opt.problem_id !== "undefined" && !isNaN(opt.problem_id)) {
			const problem_id = parseInt(opt.problem_id);
			const problem_dir = path.join(home_dir, problem_id.toString());
			let _problem_detail = await query("SELECT * FROM problem WHERE problem_id = ?", [problem_id]);
			if (_problem_detail.length === 0) {
				res.json(error_cb);
				return;
			}
			const problem_details = await pack_problem(_problem_detail[0], problem_dir);
			send_file(req, res, [problem_details], opt.problem_id);
		}
		else if (typeof opt.contest_id !== "undefined" && !isNaN(opt.contest_id)) {
			const contest_id = parseInt(opt.contest_id);
			const contest_detail = await query("SELECT * FROM contest_problem WHERE contest_id = ?", [contest_id]);
			if (contest_detail.length === 0) {
				res.json(error_cb);
				return;
			}
			let result = [];
			let len = contest_detail.length;
			for (let i of contest_detail) {
				new Promise(async resolve => {
					const problem_id = i.problem_id;
					const problem_dir = path.join(home_dir, problem_id.toString());
					let _problem_detail = await query("SELECT * FROM problem WHERE problem_id = ?", [problem_id]);
					if (_problem_detail.length === 0) {
						res.json(error_cb);
						return;
					}
					const problem_details = await pack_problem(_problem_detail[0], problem_dir);
					result.push(problem_details);
					resolve();
				}).then(() => {
					--len;
					if (len === 0) {
						send_file(req, res, result, `Contest ${contest_id}`);
					}
				});

			}
		}
	}
};

router.get("/", middleWare, (req, res) => {
	const problem_id = req.query.problem_id;
	const contest_id = req.query.contest_id;
	pack_file(req, res, {
		problem_id: problem_id,
		contest_id: contest_id
	});
});

module.exports = router;