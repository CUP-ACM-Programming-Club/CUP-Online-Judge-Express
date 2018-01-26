/**
 * Class LocalJudger
 */
const {spawn} = require("child_process");
const query = require("../module/mysql_query");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const os = require("os");

class localJudger {
	/**
	 * 构造判题机
	 * @param {String} home_dir 评测机所在的目录
	 * @param {Number} judger_num 评测机数量
	 */
	constructor(home_dir, judger_num) {
		this.oj_home = home_dir;
		this.judge_queue = [...Array(judger_num).keys()].map(x => x + 1);
		this.waiting_queue = [];
		this.judging_queue = [];
		this.latestSolutionID = 0;
		const CPUDetails = this.CPUDetails = os.cpus();
		this.CPUModel = CPUDetails[0].model;
		this.CPUSpeed = CPUDetails[0].speed;
		this.platform = os.platform();
		if (this.platform !== "linux") {
			return new Error("Your platform doesn't support right now");
		}
		localJudger.startupInit();// Reset result whose solution didn't finish
		//this.startLoopJudge(3000);
	}

	/**
	 * 开启时更新数据库状态
	 */

	static startupInit() {
		query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
	}

	/**
	 * 返回Judger状态
	 * @returns {{judging: Array, free_judger: Array, waiting: Array, last_solution_id: number|*, is_looping: *, oj_home: String|*}} 返回评测机的所有状态
	 */

	getStatus() {
		return {
			judging: this.judging_queue,
			free_judger: this.judge_queue,
			waiting: this.waiting_queue,
			last_solution_id: this.latestSolutionID,
			is_looping: this.isLooping(),
			oj_home: this.oj_home,
			cpu_details:this.CPUDetails,
			platform:this.platform
		};
	}

	/**
	 * 添加一个提交任务
	 * @param {Number} solution_id 提交ID
	 */

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

	/**
	 * （回调）获取剩余的任务
	 */

	getRestTask() {
		if (this.judge_queue.length && this.waiting_queue.length) {
			this.runJudger(this.waiting_queue.shift(), this.judge_queue.shift());
		}
	}

	/**
	 * 启动查询数据库的轮询
	 * @param {Number} time 轮询事件间隔
	 * @returns {TypeError}
	 */

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

	/**
	 * 返回judger是否轮询拾取数据库数据
	 * @returns {boolean} 轮询开始返回true 否则返回false
	 */

	isLooping() {
		return this.loopingFlag;
	}

	/**
	 * 停止轮询
	 */

	stopLoopJudge() {
		this.loopingFlag = false;
		clearInterval(this.loopJudgeFlag);
	}

	/**
	 * 运行后台判题机
	 * @param {Number} solution_id 提交ID
	 * @param {Number} runner_id 判题机ID
	 * @returns {Promise<void>} 返回一个空Promise
	 */

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

	/**
	 * 从数据库收集提交
	 * @returns {Promise<void>} 返回一个空Promise
	 */

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