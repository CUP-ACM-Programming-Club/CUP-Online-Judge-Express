/* eslint-disable no-console */
/**
 * Class LocalJudger
 */
import fsDefault from "fs";
import Promise from "bluebird";
import SocketIoClient from "socket.io-client";
import JudgeManager from "../manager/judge/JudgeManager";
import JudgeResultManager from "../manager/websocket/JudgeResultManager";
import SubmissionSet from "./websocket/set/SubmissionSet";
const os = require("os");
const eventEmitter = require("events").EventEmitter;
interface IRejectInfo {
	reason: string,
	solutionId: number | string
}

export class localJudger extends eventEmitter {
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
		socket.on("connect", () => {
			socket.emit("type", {
				type: "submitter"
			});
		});
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
			const userSocket = SubmissionSet.get(payload.solutionId);
			if (userSocket) {
				userSocket.emit("remoteJudge", {
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
}

const config = global.config;
export default new localJudger(config.judger.oj_home, Math.min(config.judger.oj_judge_num, os.cpus().length));
