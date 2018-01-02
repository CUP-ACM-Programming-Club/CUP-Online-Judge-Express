/* eslint-disable no-console */
const {spawn} = require("child_process");

class localJudger {
	constructor(home_dir, judger_num) {
		this.oj_home = home_dir;
		this.judge_queue = [...Array(judger_num).keys()].map(x => x + 1);
		this.waiting_queue = [];
		this.latestSolutionID = 0;
	}

	addTask(solution_id) {
		if (solution_id > this.latestSolutionID) {
			this.latestSolutionID = solution_id;
			if (this.judge_queue.length) {
				this.runJudger(solution_id, this.judge_queue.shift());
			}
			else {
				this.waiting_queue.push(solution_id);
			}
			console.log("added,rest:" + this.judge_queue.length);
		}
	}

	getRestTask() {
		if (this.judge_queue.length && this.waiting_queue.length) {
			this.runJudger(this.waiting_queue.shift(), this.judge_queue.shift());
		}
	}

	async runJudger(solution_id, runner_id) {
		const judger = spawn(process.cwd() + "/wsjudged", [solution_id, runner_id, this.oj_home]);
		judger.on("close", (EXITCODE) => {
			this.judge_queue.push(runner_id);
			console.log("free judge_client:" + this.judge_queue.length);
			this.getRestTask();
			console.log(`EXITCODE:${EXITCODE}`);
		});
	}
}

module.exports = localJudger;