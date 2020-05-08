/* eslint-disable no-console */
/**
 * Class LocalJudger
 */
import fsDefault from "fs";
import path from "path";
import Promise from "bluebird";
import {mkdirAsync} from "./file/mkdir";
import SocketIoClient from "socket.io-client";
import Tolerable from "../decorator/Tolerable";
import JudgeManager from "../manager/judge/JudgeManager";
import JudgeResultManager from "../manager/websocket/JudgeResultManager";
import SubmissionSet from "./websocket/set/SubmissionSet";
const fs: any = Promise.promisifyAll(fsDefault);
const {spawn} = require("child_process");
const os = require("os");
const {ConfigManager} = require("./config/config-manager");
const eventEmitter = require("events").EventEmitter;
import { v1 as uuidV1 } from "uuid";
interface IRejectInfo {
	reason: string,
	solutionId: number | string
}

export class localJudger extends eventEmitter {
	judgerExist = fsDefault.existsSync(`${process.cwd()}/wsjudged`);
	socket:SocketIOClient.Socket;
	oj_home: string;
	status: any = {free_judger: []};
	/**
     * 构造判题机
     * @param {String} home_dir 评测机所在的目录
     * @param {Number} judger_num 评测机数量
     */
	constructor(home_dir: string, judger_num: number) {
		super();
		const socket = this.socket = SocketIoClient(global.config.judger.address);
		this.oj_home = home_dir;
		socket.on("judger", (payload: any) => {
			JudgeResultManager.messageHandle(payload);
		});

		socket.on("status", (payload: any) => {
			this.status = payload;
		});

		socket.on("change", (payload: any) => {
			this.emit("change", payload);
		});

		socket.on("error_record", (payload: any) => {
			const {solutionId, recordId} = payload;
			this.errorHandle(solutionId, recordId);
		});

		socket.on("reject_judge", (payload: IRejectInfo) => {
			const socket = SubmissionSet.get(payload.solutionId);
			if (socket) {
				socket.emit("remoteJudge", {
					solutionId: payload.solutionId
				});
			}
		});

		socket.emit("status", {});
	}

	errorHandle(solutionId: number, runnerId: number) {
		if (this.errorHandler !== null) {
			this.errorHandler.record(solutionId, runnerId);
		}
	}

	setErrorHandler(errorHandler: any) {
		this.errorHandler = errorHandler;
	}


	/**
     * 返回Judger状态
     * @returns {{judging: Array, free_judger: Array, waiting: Array, last_solution_id: number|*, oj_home: String|*}} 返回评测机的所有状态
     */

	getStatus() {
		return this.status;
	}

	static formatSolutionId(solution_id: any) {
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

	updateLatestSolutionId(solutionId: number) {
		this.latestSolutionID = Math.max(this.latestSolutionID, solutionId);
	}

	async makeShareMemoryDirectory () {
		try {
			await fs.accessAsync("/dev/shm/cupoj/submission");
			// @ts-ignore
			await mkdirAsync("/dev/shm/cupoj/submission");
		}
		catch (e) {
			// do nothing
		}
		try {
			await fs.symlinkAsync("/dev/shm/cupoj/submission", this.SUBMISSION_INFO_PATH);
		}
		catch (e) {
			// do nothing
		}
	}

	@Tolerable
	async writeSubmissionInfoToDisk (solutionId: number) {
		await this.makeShareMemoryDirectory();
		const submissionInfo = await JudgeManager.buildSubmissionInfo(solutionId);
		const uuid = uuidV1();
		// @ts-ignore
		await fs.writeFileAsync(path.join(this.SUBMISSION_INFO_PATH, `${uuid}.json`), JSON.stringify(submissionInfo), { mode: 0o777 });
		return uuid;
	}

	static JudgeExists(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
		const method = propertyDescriptor.value;
		propertyDescriptor.value = async function (...args: any[]) {
			const thisTarget = this as localJudger;
			if (thisTarget.judgerExist || thisTarget.socket.connected) {
				return await method.apply(this, args);
			}
			else {
				return false;
			}
		}
	}

	async problemDataExist (problemId: number | string) {
		try {
			await fsDefault.promises.access(path.join(this.oj_home, "data", problemId + ""));
			return true;
		}
		catch (e) {
			return false;
		}
	}

	@localJudger.JudgeExists
	async addTask(solution_id: any, admin: boolean, no_sim = false, priority = 1) {
		const data = await JudgeManager.buildSubmissionInfo(solution_id);
		this.socket.emit("submission", {
			solutionId: solution_id,
			admin,
			data,
			no_sim,
			priority
		});
		return true;
		// solution_id, admin, data
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
			this.judging_queue.push(solution_id);
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

	async runJudger(solution_id: number, runner_id: number, admin = false, no_sim = false, gray_task = false) {
		const judgerId = await this.writeSubmissionInfoToDisk(solution_id);
		const stderrBuilder: any = [], stdoutBuilder: any = [];
		let args = ["-solution_id", solution_id, "-runner_id", runner_id, "-dir", this.oj_home, "-judger_id", judgerId];
		if (!judgerId) {
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
		judger.on("close", (EXITCODE: any) => {
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
		judger.stdout.on("data", (resp: any) => {stdoutBuilder.push(resp.toString());});
		judger.stderr.on("data", (resp: any) => {stderrBuilder.push(resp.toString());});
	}
}

const config = global.config;
export default new localJudger(config.judger.oj_home, Math.min(config.judger.oj_judge_num, os.cpus().length));
