const {spawn} = require("child_process");
const query = require("../module/mysql_query");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");

class localJudger {
	constructor(home_dir, judger_num) {
		this.oj_home = home_dir;
		this.judge_queue = [...Array(judger_num).keys()].map(x => x + 1);
		this.waiting_queue = [];
		this.judging_queue = [];
		this.latestSolutionID = 0;
		localJudger.startupInit();// Reset result whose solution didn't finish
		this.startLoopJudge(3000);
	}

	static startupInit() {
		query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
	}

	getStatus() {
		return {
			judging: this.judging_queue,
			free_judger: this.judging_queue,
			waiting: this.waiting_queue,
			last_solution_id: this.latestSolutionID,
			is_looping: this.isLooping(),
			oj_home: this.oj_home
		};
	}

	addTask(solution_id) {
		if (solution_id > this.latestSolutionID &&
		!~this.judging_queue.indexOf(solution_id) &&
		!~this.waiting_queue.indexOf(solution_id)) {
			this.latestSolutionID = solution_id;
			if (this.judge_queue.length) {
				this.runJudger(solution_id, this.judge_queue.shift());
				this.judging_queue.push(solution_id);
			}
			else {
				this.waiting_queue.push(solution_id);
			}
		}
	}

	getRestTask() {
		if (this.judge_queue.length && this.waiting_queue.length) {
			this.runJudger(this.waiting_queue.shift(), this.judge_queue.shift());
		}
	}

	startLoopJudge(time = 1000) {
		if (this.isLooping()) {
			this.stopLoopJudge();
		}
		this.loopingFlag = true;
		this.loopJudgeFlag = setInterval(() => {
			this.collectSubmissionFromDatabase();
		}, time);
	}

	isLooping() {
		return this.loopingFlag;
	}

	stopLoopJudge() {
		this.loopingFlag = false;
		clearInterval(this.loopJudgeFlag);
	}

	async runJudger(solution_id, runner_id) {
		const judger = spawn(`${process.cwd()}/wsjudged`, [solution_id, runner_id, this.oj_home]);
		judger.on("close", EXITCODE => {
			this.judge_queue.push(runner_id);
			const solutionPOS = this.judging_queue.indexOf(solution_id);
			if (~solutionPOS) {
				this.judging_queue.splice(solutionPOS, 1);
			}
			this.getRestTask();
			if (EXITCODE) logger.fatal(`Fatal Error:\n
				solution_id:${solution_id}\n
				runner_id:${runner_id}\n
				`);
		});
		judger.stdout.on("data", () => {

		});
		judger.stderr.on("data", () => {

		});
	}

	async collectSubmissionFromDatabase() {
		let result = await query("SELECT solution_id FROM solution WHERE result<2");
		for (let i in result) {
			const solution_id = parseInt(result[i].solution_id);
			if (!isNaN(solution_id) &&
				!~this.waiting_queue.indexOf(solution_id) &&
				!~this.judging_queue.indexOf(solution_id)) {
				if (this.judge_queue.length) {
					this.runJudger(solution_id, this.judge_queue.shift());
					this.judging_queue.push(solution_id);
				}
				else {
					this.waiting_queue.push(solution_id);
				}
			}
		}
	}
}

module.exports = localJudger;