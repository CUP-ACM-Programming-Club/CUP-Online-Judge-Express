/* eslint-disable no-console */
const dockerJudger = require("./docker_judger");
const query = require("./mysql_query");
const cache_query = require("./mysql_cache");
const os = require("os");

class dockerRunner {
	constructor(home_dir, judger_num) {
		this.oj_home = home_dir;
		this.waiting_queue = [];
		this.judging_queue = [];
		this.querying_queue = [];
		this.isProcessingQueue = false;
		this.latestSolutionID = 0;
		this.platform = os.platform();
		if (this.platform !== "linux") {
			return new Error("Your platform doesn't support right now");
		}
		dockerRunner.startupInit();// Reset result whose solution didn't finish
		this.startLoopJudge(3000);
		this.waiting_package = {};
		this.judge_queue = [];
		for (let i = 0; i < judger_num; ++i) {
			this.judge_queue.push(this.makeJudger(home_dir));
		}
	}

	static startupInit() {
		query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
	}

	async processQueryQueue(sql, sqlArr = []) {
		if (sql && sql.length > 0) {
			this.querying_queue.push({
				sql,
				sqlArr
			});
		}
		if (this.isProcessingQueue) {
			return;
		}
		this.isProcessingQueue = true;
		while (this.querying_queue.length > 0) {
			const sqlTask = this.querying_queue.shift();
			await query(sqlTask.sql, sqlTask.sqlArr);
		}
		if (this.querying_queue.length > 0) {
			this.processQueryQueue();
		}
		else {
			this.isProcessingQueue = false;
		}
	}

	startLoopJudge(time = 1000) {
		if (typeof time !== "number") {
			return new TypeError("variable time must be a number");
		}
		if (this.isLooping()) {
			this.stopLoopJudge();
		}
		this.loopingFlag = true;
		this.loopJudgeFlag = setInterval(() => {
			this.collectSubmissionFromDatabase();
		}, time);
	}

	getStatus() {
		return {
			judging: this.judging_queue,
			free_judger: this.judge_queue,
			waiting: this.waiting_queue,
			last_solution_id: this.latestSolutionID,
			is_looping: this.isLooping(),
			oj_home: this.oj_home,
			cpu_details: this.CPUDetails,
			platform: this.platform
		};
	}

	stopLoopJudge() {
		this.loopingFlag = false;
		clearInterval(this.loopJudgeFlag);
	}

	isLooping() {
		return this.loopingFlag;
	}

	makeJudger(oj_home) {
		const judger = new dockerJudger(oj_home);
		const that = this;
		judger.on("processing", async function (data) {
			const solution_id = parseInt(judger.submit_id);
			const time = parseInt(data.time);
			const memory = parseInt(data.memory);
			const pass_point = parseInt(data.pass_point);
			const compile_message = data.compile_msg || "";
			const test_run_result = data.test_run_result || undefined;
			let status = parseInt(data.status);
			if (judger.mode === 1) {
				if (status === 4) {
					status = 13;
				}
			}
			if (global.submissions[solution_id]) {
				global.submissions[solution_id].emit("result", {
					solution_id: solution_id,
					time: time,
					memory: memory,
					pass_point: pass_point,
					compile_info: compile_message,
					test_run_result: test_run_result,
					state: status
				});
			}
			if (status > 3) {
				that.processQueryQueue("UPDATE solution set time=?,memory=?,pass_point=?,result=? WHERE solution_id=?",
					[time, memory, pass_point, status, solution_id]);
			}
			if (compile_message && compile_message.length > 0) {
				that.processQueryQueue("INSERT INTO compileinfo (solution_id,error) VALUES (?,?)", [solution_id, compile_message]);
			}
		});

		judger.on("finish", async function () {
			that.judge_queue.push(that.makeJudger(oj_home));
			const solutionPos = that.judging_queue.indexOf(judger.submit_id);
			if (~solutionPos) {
				that.judging_queue.splice(solutionPos, 1);
			}
			if (judger.user_id) {
				that.processQueryQueue("UPDATE `users` SET `solved`=(SELECT count(DISTINCT `problem_id`) FROM `solution` WHERE `user_id`='?' AND `result`='4') WHERE `user_id`='?'", [judger.user_id, judger.user_id]);
				that.processQueryQueue("UPDATE `users` SET `submit`=(SELECT count(*) FROM `solution` WHERE `user_id`='?' and problem_id>0) WHERE `user_id`='?'", [judger.user_id, judger.user_id]);
			}
			that.processQueryQueue("UPDATE `problem` SET `accepted`=(SELECT count(*) FROM `solution` WHERE `problem_id`='?' AND `result`='4') WHERE `problem_id`='?'", [judger.problem_id, judger.problem_id]);
			that.processQueryQueue("UPDATE `problem` SET `submit`=(SELECT count(*) FROM `solution` WHERE `problem_id`='?') WHERE `problem_id`='?'", [judger.problem_id, judger.problem_id]);
			if (that.waiting_queue.length > 0) {
				let solution_id;
				await that.runJudger(that.waiting_package[(solution_id = this.waiting_queue.shift())]);
				delete that.waiting_package[solution_id];
				that.judging_queue.push(solution_id);
			}
		});
		judger.on("debug", function () {
		});
		return judger;
	}

	addTask(task) {
		const solution_id = parseInt(task.solution_id);
		if (solution_id > this.latestSolutionID) {
			this.latestSolutionID = solution_id;
			const language = parseInt(task.val.language);
			let contest_id = NaN;
			if (task.val.cid) {
				contest_id = parseInt(task.val.cid);
			}
			const problem_id = parseInt(task.val.id);
			const code = task.val.source || "";
			const user_id = task.user_id;
			const input_text = task.val.input_text;
			if (!~this.judging_queue.indexOf(solution_id) &&
                !~this.waiting_queue.indexOf(solution_id)) {
				const submitPack = {
					solution_id: solution_id,
					language: language,
					problem_id: problem_id,
					contest_id: contest_id,
					code: code,
					user_id: user_id,
					input_text: input_text
				};
				if (this.judge_queue.length) {
					this.runJudger(submitPack);
					this.judging_queue.push(solution_id);
				}
				else {
					this.waiting_queue.push(solution_id);
					this.waiting_package[solution_id] = submitPack;
				}
			}
		}
	}

	async runJudger(submitPack) {
		const judger = this.judge_queue.pop();
		const problem_id = Math.abs(parseInt(submitPack.problem_id));
		let contest_id = NaN;
		const solution_id = parseInt(submitPack.solution_id);
		const language = parseInt(submitPack.language);
		const input_text = submitPack.input_text;
		const test_run = submitPack.test_run;
		if (submitPack.contest_id) {
			contest_id = Math.abs(parseInt(submitPack.contest_id));
		}
		if (test_run || (contest_id && contest_id !== parseInt(submitPack.contest_id)) || problem_id !== parseInt(submitPack.problem_id)) {
			judger.pushRawFile({
				name: "custominput.in",
				data: (" " + input_text).slice(1)
			});
			judger.setMode(1);
			judger.setTimeLimit(5);
			judger.setTimeLimitReserve(2);
			judger.setMemoryLimit(256);
			judger.setMemoryLimitReserve(128);
		}
		else {
			await judger.setProblemID(problem_id);
		}
		judger.setSolutionID(solution_id);
		judger.setCode(submitPack.code);
		judger.setLanguage(language);
		await judger.run();
	}

	async collectSubmissionFromDatabase() {
		let result = await query(`SELECT * FROM (SELECT solution.solution_id,solution.num,solution.user_id,
		solution.language,solution.problem_id,source_code.source,solution.result,solution.contest_id,
		custominput.input_text FROM solution left join source_code on
		 source_code.solution_id = solution.solution_id left join custominput on
		  custominput.solution_id = solution.solution_id)sol WHERE sol.result<2 and sol.language in (15,22) limit 20`);
		for (let i in result) {
			const solution_id = parseInt(result[i].solution_id);
			let problem_id = parseInt(result[i].problem_id);
			const language = parseInt(result[i].language);
			const contest_id = parseInt(result[i].contest_id);
			const num = parseInt(result[i].num);
			let test_run = false;
			if (contest_id) {
				const qpack = await cache_query("SELECT problem_id FROM contest_problem WHERE contest_id = ? and num = ?", [contest_id, num]);
				problem_id = parseInt(qpack[0].problem_id);
			}
			if (problem_id === 0) {
				test_run = true;
			}
			const input_text = result[i].input_text ? result[i].input_text.toString() : result[i].input_text;
			const code = result[i].source;
			const user_id = result[i].user_id ? result[i].user_id.toString() : result[i].user_id;
			if (!~this.judging_queue.indexOf(solution_id) &&
                !~this.waiting_queue.indexOf(solution_id)) {
				const submitPack = {
					solution_id: solution_id,
					language: language,
					problem_id: problem_id,
					contest_id: contest_id,
					code: code,
					user_id: user_id,
					input_text: input_text,
					test_run: test_run
				};
				if (this.judge_queue.length) {
					await this.runJudger(submitPack);
					this.judging_queue.push(solution_id);
				}
				else {
					this.waiting_queue.push(solution_id);
					this.waiting_package[solution_id] = submitPack;
				}
			}
		}
	}
}

module.exports = dockerRunner;
