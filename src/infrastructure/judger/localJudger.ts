/* eslint-disable no-console */
/**
 * Class LocalJudger
 */
import fsDefault from "fs";
import Promise from "bluebird";
import SocketIoClient from "socket.io-client";
import JudgeManager from "../persistence/judge/JudgeManager";
import { judgerEventListener, RejectJudgeInfo, SubmissionJudger } from "../../application/ports/SubmissionJudger";
import { judgeQueueRepository } from "../../application/ports/JudgeQueueRepository";
import { ConfigManager } from "../config/config-manager";
// 原先经 JudgeResultManager 间接加载：log4j 在加载时 configure log4js，保持它在判题机客户端加载时生效
import "../logging/log4j";
const os = require("os");
/** 领取后超过这么久还停在排队（result=14），认为领取方已失联，允许别的服务器重新领取 */
export const CLAIM_LEASE_SECONDS = 300;
const eventEmitter = require("events").EventEmitter;

/**
 * 判题机客户端，实现 application 的判题机端口（SubmissionJudger）。
 * 判题结果、拒绝判题等事件交给 application 的 JudgerEventListener 端口处理。
 */
export class localJudger extends eventEmitter implements SubmissionJudger {
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
			judgerEventListener.onJudgeResult(payload);
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

		socket.on("reject_judge", (payload: RejectJudgeInfo) => {
			judgerEventListener.onRejectJudge(payload);
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
		if (!this.socket.connected) {
			return false;
		}
		// 先领取再送判：acm(.16) 与 oj(.28) 共用一个数据库，各自的收集器都会捡等待中的提交；
		// 领取失败说明另一台已经在判，本机跳过，避免同一份提交被判两遍
		if (ConfigManager.isSwitchedOn("enable_judge_claim", ConfigManager.SWITCH_ON)) {
			const lease = ConfigManager.getConfig("judge_claim_lease_seconds", CLAIM_LEASE_SECONDS);
			if (!await judgeQueueRepository.claimForJudging(solution_id, lease)) {
				return false;
			}
		}
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
