import {Cluster, default as cluster, Worker} from "cluster";
import AwaitLock from "await-lock";
import {Dayjs, default as dayjs} from "dayjs";
import {IReload} from "./reload";
import {BaseReload} from "./BaseReload";
const lock = new AwaitLock();
declare global {
	namespace NodeJS {
		interface Global {
			workers: Worker[],
				restart: boolean | undefined
		}
	}
}

interface HotReloadMethod {
	[id: string]: (...args: any[]) => any
}

interface ClusterVersion {
	version: Dayjs,
		result: boolean
}

class HotReloadManager extends BaseReload implements IReload{
	get _cluster__(): ClusterVersion | {} | undefined {
		return this.__cluster__;
	}

	set _cluster__(value: ClusterVersion | {} | undefined) {
		this.__cluster__ = value;
	}

	protected __cluster__: ClusterVersion | {} | undefined;

	constructor() {
		super();
		const method: HotReloadMethod = {
			"restart": this.restart
		};
		if (cluster.isMaster) {
			cluster.on("online", (worker: Worker) => {
				worker.on("message", (data) => {
					if (!data.hotReload) {
						return;
					}
					method[data.method].apply(this, data.arg || []);
				});
			});
		}
		else {
			this.__cluster__ = {
				version: dayjs(),
				result: true
			};
		}

		process.on("exit", () => {
			const safeExit = require("./worker/safe-exit");
			safeExit();
		});
	}

	async tryFork() {
		const worker = cluster.fork();
		const alive = await new Promise(resolve => {
			setTimeout(() => {
				resolve(!worker.isDead());
			}, 3000);
		});
		if (alive) {
			worker.destroy();
		}
		return alive;
	}

	async restart() {
		try {
			await lock.acquireAsync();
			const forkTest = await this.tryFork();
			const workerList = global.workers;
			const num = global.workers.length;
			if (!forkTest) {
				return;
			}
			global.restart = false;

			for (let i = 0; i < num; ++i) {
				const destroyWorker: Worker = <Worker>workerList.shift();
				const forkWorker = cluster.fork();
				const bootstrap = new Promise(resolve => {
					forkWorker.on("online", resolve);
				});
				await bootstrap;
				workerList.push(forkWorker);
				destroyWorker.destroy();
			}
			global.restart = true;
		}
		catch (e) {

		}
		finally {
			lock.release();
		}
	}

	restartNotify() {
		process.send!({
			hotReload: true,
			method: "restart"
		});
		return this;
	}
}

export = new HotReloadManager();
