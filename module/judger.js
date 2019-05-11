/* eslint-disable no-console */
/**
 * Class LocalJudger
 */
const {spawn} = require("child_process");
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const PriorityQueue = require("tinyqueue");
const os = require("os");
const eventEmitter = require("events").EventEmitter;

const SECOND = {
	ONE_SECOND: 1000,
	TWO_SECOND: 2000,
	THREE_SECOND: 3000,
	FIVE_SECOND: 5000,
	TEN_SECOND: 10000
};

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
		if (this.platform !== "linux" && this.platform !== "darwin") {
			return new Error("Your platform doesn't support right now");
		}
		localJudger.startupInit();// Reset result whose solution didn't finish
		//this.collectSubmissionFromDatabase();
		require("./judger/looper").call(this, SECOND.THREE_SECOND);
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
			cpu_details: this.CPUDetails,
			cpu_model: this.CPUModel,
			cpu_speed: this.CPUSpeed,
			platform: this.platform
		};
	}

	/**
     * 添加一个提交任务
     * @param {Number} solution_id 提交ID
     */

	addTask(solution_id, admin) {
		if (typeof solution_id === "object") {
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
		if (solution_id > this.latestSolutionID &&
            !~this.judging_queue.indexOf(solution_id) &&
            !this.in_waiting_queue[solution_id]) {
			this.latestSolutionID = solution_id;
			if (this.judge_queue.length) {
				this.runJudger(solution_id, this.judge_queue.shift(), admin);
				this.judging_queue.push(solution_id);
			} else {
				this.waiting_queue.push({
					solution_id: solution_id,
					priority: 1,
					admin
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
			delete this.in_waiting_queue[solution_id];
			this.runJudger(solution_id, this.judge_queue.shift(), admin);
		}
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
     * @param {Boolean} admin 管理员提交
     * @returns {Promise<void>} 返回一个空Promise
     */

	async runJudger(solution_id, runner_id, admin = false) {
		let args = ["-solution_id", solution_id, "-runner_id", runner_id, "-dir", this.oj_home];
		if (admin) {
			args.push("-admin");
		}
		const judger = spawn(`${process.cwd()}/wsjudged`, args);
		let killed = false;
		let timeoutID = setTimeout(() => {
			killed = true;
			judger.kill("SIGKILL");
		},1000 * 100);//kill process after 100s
		this.emit("change", this.getStatus().free_judger);
		judger.on("close", EXITCODE => {
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
			if (EXITCODE) {
				query("update solution set result = 16 where solution_id = ?", [solution_id]);
				logger.fatal(`Fatal Error:\n
				solution_id:${solution_id}\n
				runner_id:${runner_id}\n
				`);
				if (process.env.NODE_ENV === "test") {
					console.log(`Fatal Error:\n
				solution_id:${solution_id}\n
				runner_id:${runner_id}\n
				`);
				}
			}
		});
		//judger.stdout.on("data", () => {});no use
		//judger.stderr.on("data", () => {});no use
	}

	/**
     * 从数据库收集提交
     * @returns {Promise<void>} 返回一个空Promise
     */

	async collectSubmissionFromDatabase() {
		if (process.env.NODE_ENV === "local") {
			return;
		}
		let result = await query("SELECT solution_id,user_id FROM solution WHERE result<2 and language not in (15,22)");
		for (let i in result) {
			const _data = await cache_query("SELECT count(1) as cnt from privilege where user_id = ? and rightstr = 'administrator'",
				[result[i].user_id]);
			const admin = Boolean(_data && _data.length && _data[0].cnt);
			const solution_id = parseInt(result[i].solution_id);
			const priority = parseInt(result[i].result);
			if (!isNaN(solution_id) &&
                !this.in_waiting_queue[solution_id] &&
                !~this.judging_queue.indexOf(solution_id)) {
				if (this.judge_queue.length) {
					this.runJudger(solution_id, this.judge_queue.shift(), admin);
					this.judging_queue.push(solution_id);
				} else {
					this.waiting_queue.push({
						solution_id: solution_id,
						priority: !priority
					});
					this.in_waiting_queue[solution_id] = true;
				}
			}
		}
	}
}


module.exports = localJudger;
