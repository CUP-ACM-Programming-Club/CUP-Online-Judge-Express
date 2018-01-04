const {spawn} = require("child_process");
const query = require("../module/mysql_query");

class localJudger {
	constructor(home_dir, judger_num) {
		this.oj_home = home_dir;
		this.judge_queue = [...Array(judger_num).keys()].map(x => x + 1);
		this.waiting_queue = [];
		this.judging_queue = [];
		this.latestSolutionID = 0;
		this.loopJudgeFlag = setInterval(() => {
			this.collectSubmissionFromDatabase();
		}, 3000);
	}

	addTask(solution_id) {
		if (solution_id > this.latestSolutionID) {
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
		this.loopJudgeFlag = setInterval(() => {
			this.collectSubmissionFromDatabase();
		}, time);
	}

	stopLoopJudge() {
		clearInterval(this.loopJudgeFlag);
	}

	async runJudger(solution_id, runner_id) {
		const judger = spawn(process.cwd() + "/wsjudged", [solution_id, runner_id, this.oj_home]);
		/*
		judger.stdout.on("data",(data)=>{
			console.log(data.toString());
		});
		*/
		judger.on("close", () => {
			this.judge_queue.push(runner_id);
			const solutionPOS = this.judging_queue.indexOf(solution_id);
			if (!~solutionPOS) {
				this.judging_queue.splice(solutionPOS, 1);
			}
			this.getRestTask();
		});
	}

	async collectSubmissionFromDatabase() {
		//console.log("Judge empty:" + this.judge_queue.length);
		//console.log("Judging:");
		//console.log(this.judging_queue);
		let result = await query("SELECT solution_id FROM solution WHERE result<2");
		//console.log(result);
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