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

class dockerJudger {

	constructor(oj_home) {
		this.oj_home = oj_home;
		this.inputFile = [];
		this.outputFile = [];
		this.Sandbox = Sandbox;
		this.submit = this.Sandbox.createSubmit();
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

	setCode(code){
		this.code = code;
		this.submit.pushInputRawFiles({
			name:`Main${dockerJudger.parseLanguageSuffix(this.language)}`,
			data:code
		});
	}

	pushRawFile(file){
		this.submit.pushInputRawFiles({
			name:file.name,
			data:file.data
		});
	}

	async run() {
		if (this.problem_id) {
			const dirname = path.join(this.oj_home, "data", this.problem_id.toString());
			const filelist = await fs.readdirAsync(dirname);
			for (let i in filelist) {
				if (filelist[i].indexOf(".in") > 0) {
					this.submit.pushInputFiles(path.join(dirname,filelist[i]));
				}
			}
			this.submit.setTimeLimit(this.time_limit);
			this.submit.setTimeLimitReserve(this.time_limit_reserve);
			this.submit.setMemoryLimit(this.memory_limit);
			this.submit.setMemoryLimitReverse(this.memory_limit_reserve);
			this.result = await this.Sandbox.runner(this.submit);
		}
	}

}


module.exports = dockerJudger;