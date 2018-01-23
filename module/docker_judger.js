/* eslint-disable no-unused-vars */
/**
 * Class LocalJudger
 */
//const query = require("../module/mysql_query");
const log4js = require("../module/logger");
//const logger = log4js.logger("normal", "info");
const Sandbox = require("../docker/index");
const path = require("path");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const checker = require("checker");
const OUTPUT_LIMIT_EXCEEDED = -1;
const WRONG_ANSWER = 0;
const PRESENTATION_ERROR = 1;
const ACCEPTED = 2;
const COMPILE_ERROR = 3;
const RUNTIME_ERROR = 4;
const TIME_LIMIT_EXCEEDED = 5;
const MEMORY_LIMIT_EXCEEDED = 6;
const CLOCK_LIMIT_EXCEEDED = 7;

function parseResult(code, time, memory, pass_point, compile_msg, compile_error_msg) {
	return {
		status: code,
		time: time,
		memory: memory,
		pass_point: pass_point,
		compile_message: compile_msg,
		compile_error_message: compile_error_msg
	};
}

class dockerJudger {

	constructor(oj_home) {
		this.oj_home = oj_home;
		this.inputFile = [];
		this.outputFile = [];
		this.Sandbox = Sandbox;
		this.submit = this.Sandbox.createSubmit();
	}

	static parseJudgerCodeToWeb(code) {
		const status = {
			"2": 4,
			"1": 5,
			"0": 6,
			"5": 7,
			"6": 8,
			"-1": 9,
			"4": 10,
			"3": 11,
		};
		return status[code.toString()];
	}

	static parseLanguage(language) {
		language = parseInt(language);
		const languageToName =
			["c11", "c++17", "pascal", "java",
				"ruby", "bash", "python2", "php",
				"perl", "csharp", "objc", "freebasic",
				"schema", "clang", "clang++", "lua",
				"nodejs", "go", "python3", "c++11",
				"c++98", "c99"];
		if (language > -1 && language < languageToName.length) {
			return languageToName[language];
		}
	}

	static parseLanguageSuffix(language) {
		let languageSuffix = {
			"c": ".c",
			"c11": ".c",
			"c99": ".c",
			"c89": ".c",
			"c++": ".cpp",
			"c++11": ".cpp",
			"c++14": ".cpp",
			"c++98": ".cpp",
			"c++17": ".cpp",
			"csharp": ".cs",
			"nodejs": ".js",
			"python2": ".py",
			"python3": ".py",
			"clang": ".c",
			"clang++": ".cpp",
			"php": ".php",
			"lua": ".lua",
			"kotlin": ".kt",
			"bash": ".sh",
			"pascal": ".pas",
			"go": ".go"
		};
		return languageSuffix[language];
	}

	static sandboxCodeToJudger(code) {
		const status = [ACCEPTED, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED,
			OUTPUT_LIMIT_EXCEEDED, RUNTIME_ERROR];
		return status[code];
	}

	setProblemID(problem_id) {
		this.problem_id = parseInt(problem_id);
		if (isNaN(this.problem_id) || this.problem_id < 1000) {
			this.problem_id = undefined;
			if (isNaN(this.problem_id)) {
				throw new TypeError("problem_id should be a integer");
			}
			else {
				throw new Error("problem_id should larger than 1000");
			}
		}
	}

	setTimeLimit(time_limit) {
		this.time_limit = parseFloat(time_limit);
	}

	setTimeLimitReserve(time_limit_reserve) {
		this.time_limit_reserve = parseFloat(time_limit_reserve);
	}

	setMemoryLimit(memory_limit) {
		this.memory_limit = parseInt(memory_limit);
	}

	setMemoryLimitReserve(memory_limit_reserve) {
		this.memory_limit_reserve = parseInt(memory_limit_reserve);
	}

	setLanguage(language) {
		this.language = dockerJudger.parseLanguage(language);
		this.submit.setLanguage(this.language);
	}

	setCompareFn(fn) {
		if (typeof fn === "function") {
			this.compare_fn = fn;
		}
		else {
			return new TypeError("argument must be function");
		}
	}

	on(event, callback) {
		if (typeof event === "string") {
			if (typeof fn === "function") {
				this.submit.on(event, callback);
			}
			else {
				return new TypeError("callback must be function");
			}
		}
		else {
			return new TypeError("event must be a string");
		}
	}

	setSpecialJudge(file,language){

	}

	setCustomInput(input) {
		this.submit.pushInputRawFiles({
			name: "custominput.in",
			data: input
		});
	}

	setCode(code) {
		this.code = code;
		this.submit.pushInputRawFiles({
			name: `Main${dockerJudger.parseLanguageSuffix(this.language)}`,
			data: code
		});
	}

	pushRawFile(file) {
		this.submit.pushInputRawFiles({
			name: file.name,
			data: file.data
		});
	}

	async run() {
		if (this.problem_id) {
			const dirname = path.join(this.oj_home, "data", this.problem_id.toString());
			const filelist = await fs.readdirAsync(dirname);
			const outfilelist = [];
			for (let i in filelist) {
				if (filelist[i].indexOf(".in") > 0) {
					this.submit.pushInputFiles(path.join(dirname, filelist[i]));
				}
				else if (filelist[i].indexOf(".out") > 0) {
					outfilelist.push(path.join(dirname, filelist[i]));
				}
			}
			this.submit.setTimeLimit(this.time_limit);
			this.submit.setTimeLimitReserve(this.time_limit_reserve);
			this.submit.setMemoryLimit(this.memory_limit);
			this.submit.setMemoryLimitReverse(this.memory_limit_reserve);
			this.result = await this.Sandbox.runner(this.submit);
			const status = this.result.status;
			let judge_return_val;
			let time = 0, memory = 0;
			let pass_point = 0;
			let compile_msg = this.result.compile_out;
			let compile_err_msg = this.result.compile_error;
			if (~compile_err_msg.indexOf("error")) {
				judge_return_val = COMPILE_ERROR;
			}
			if (!judge_return_val) {
				for (let i in this.result.result) {
					time = Math.max(parseInt(this.result.result[i].time_usage), time);
					memory = Math.max(parseInt(this.result.result[i].memory_usage), memory);
					if ((judge_return_val = parseInt(this.result.result[i].runtime_flag))) {
						judge_return_val = dockerJudger.sandboxCodeToJudger(judge_return_val);
						break;
					}
					++pass_point;
				}
			}
			if (status !== "OK" || judge_return_val) {
				return parseResult(judge_return_val, time, memory, pass_point, compile_msg, compile_err_msg);
			}
			else {
				const result = await checker.compareDiff(this.result.output_files, ...outfilelist);
				//return parseResult(parseJudgerCodeToWeb(result),time,memory,pass_point,compile_err_msg)
			}
		}
	}

}


module.exports = dockerJudger;