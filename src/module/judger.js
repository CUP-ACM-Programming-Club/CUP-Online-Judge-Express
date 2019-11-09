/* eslint-disable no-console */
/**
 * Class LocalJudger
 */
const {spawn} = require("child_process");
const PriorityQueue = require("tinyqueue");
const os = require("os");
const {ConfigManager} = require("./config/config-manager");
const eventEmitter = require("events").EventEmitter;

class localJudger extends eventEmitter {
	/**
     * 构造判题机
     * @param {String} home_dir 评测机所在的目录
     * @param {Number} judger_num 评测机数量
     */
	constructor(home_dir, judger_num) {
		super();
		this.oj_home = home_dir;
		this.judge_queue = [...Array(judger_num).keys()].map(x => x + 1);
		this.waiting_queue = new PriorityQueue([], function (a, b) {
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			} else {
				return b.solution_id - a.solution_id;
			}
		});
		this.in_waiting_queue = {};
		this.judging_queue = [];
		this.latestSolutionID = 0;
		const CPUDetails = this.CPUDetails = os.cpus();
		this.CPUModel = CPUDetails[0].model;
		this.CPUSpeed = CPUDetails[0].speed;
		this.platform = os.platform();
		this.errorHandler = null;
		if (this.platform !== "linux" && this.platform !== "darwin") {
			return new Error("Your platform doesn't support right now");
		}
	}

	errorHandle(solutionId, runnerId) {
		if (this.errorHandler !== null) {
			this.errorHandler.record(solutionId, runnerId);
		}
	}

	setErrorHandler(errorHandler) {
		this.errorHandler = errorHandler;
	}


	/**
     * 返回Judger状态
     * @returns {{judging: Array, free_judger: Array, waiting: Array, last_solution_id: number|*, oj_home: String|*}} 返回评测机的所有状态
     */

	getStatus() {
		return {
			judging: this.judging_queue,
			free_judger: this.judge_queue,
			waiting: this.waiting_queue,
			last_solution_id: this.latestSolutionID,
			oj_home: this.oj_home,
			cpu_details: this.CPUDetails,
			cpu_model: this.CPUModel,
			cpu_speed: this.CPUSpeed,
			platform: this.platform
		};
	}

	static formatSolutionId(solution_id) {
		if (typeof solution_id === "object" && solution_id !== null) {
			if (!isNaN(solution_id.submission_id)) {
				solution_id = solution_id.submission_id;
			} else if (!isNaN(solution_id.solution_id)) {
				solution_id = solution_id.solution_id;
			} else {
				console.log("Error:Not valid solution_id");
			}
		} else {
			solution_id = parseInt(solution_id);
		}
		return solution_id;
	}

	updateLatestSolutionId(solutionId) {
		this.latestSolutionID = Math.max(this.latestSolutionID, solutionId);
	}

	addTask(solution_id, admin, no_sim = false, priority = 1, gray_task = false) {
		solution_id = localJudger.formatSolutionId(solution_id);
		if (!this.judging_queue.includes(solution_id) &&
            !this.in_waiting_queue[solution_id]) {
			this.updateLatestSolutionId(solution_id);
			if (!this.judge_queue.isEmpty()) {
				this.runJudger(solution_id, this.judge_queue.shift(), admin, no_sim, gray_task);
				this.judging_queue.push(solution_id);
			} else {
				this.waiting_queue.push({
					solution_id,
					priority,
					admin,
					no_sim,
					gray_task
				});
				this.in_waiting_queue[solution_id] = true;
			}
		}
	}

	/**
     * （回调）获取剩余的任务
     */

	getRestTask() {
		if (this.judge_queue.length && this.waiting_queue.length) {
			const task = this.waiting_queue.pop();
			const solution_id = task.solution_id;
			const admin = task.admin;
			const no_sim = task.no_sim;
			const gray_task = task.gray_task;
			delete this.in_waiting_queue[solution_id];
			this.runJudger(solution_id, this.judge_queue.shift(), admin, no_sim, gray_task);
		}
	}


	/**
     * 运行后台判题机
     * @param {Number} solution_id 提交ID
     * @param {Number} runner_id 判题机ID
     * @param {Boolean} admin 管理员提交
     * @param {Boolean} no_sim 不启用判重
	 * @param {Boolean} gray_task 灰度任务
     * @returns {Promise<void>} 返回一个空Promise
     */

	async runJudger(solution_id, runner_id, admin = false, no_sim = false, gray_task = false) {
		const stderrBuilder = [], stdoutBuilder = [];
		let args = ["-solution_id", solution_id, "-runner_id", runner_id, "-dir", this.oj_home];
		if (gray_task) {
			args.push("-no-mysql");
		}
		if (admin) {
			args.push("-admin");
		}
		if (no_sim) {
			args.push("-no-sim");
		}
		const judger = spawn(`${process.cwd()}/wsjudged`, args);
		if (process.env.NODE_ENV === "test") {
			console.log("arguments: ", args);
		}
		let killed = false;
		let timeoutID = setTimeout(() => {
			killed = true;
			judger.kill("SIGKILL");
		}, ConfigManager.getConfig("judger_process_kill_time", 1000 * 30));//kill process after 100s
		this.emit("change", this.getStatus().free_judger);
		judger.on("close", EXITCODE => {
			if (process.env.NODE_ENV === "test") {
				console.log(`solution_id: ${solution_id}, EXITCODE:${EXITCODE}`);
			}
			this.judge_queue.push(runner_id);
			if(!killed) {
				clearTimeout(timeoutID);
			}
			const solutionPOS = this.judging_queue.indexOf(solution_id);
			if (~solutionPOS) {
				this.judging_queue.splice(solutionPOS, 1);
			}
			this.emit("change", this.getStatus().free_judger);
			this.getRestTask();
			if (null === EXITCODE || EXITCODE) {
				console.log("stdout: \n", stdoutBuilder.join(""));
				console.log("stderr: \n", stderrBuilder.join(""));
				this.errorHandle(solution_id, runner_id);
			}
		});
		judger.stdout.on("data", (resp) => {stdoutBuilder.push(resp.toString());});
		judger.stderr.on("data", (resp) => {stderrBuilder.push(resp.toString());});
	}
}

const config = global.config;

module.exports = new localJudger(config.judger.oj_home, config.judger.oj_judge_num);
