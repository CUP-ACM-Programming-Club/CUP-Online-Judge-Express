const cluster = require("cluster");
const AwaitLock = require("await-lock").default;
const lock = new AwaitLock();

class HotReloadManager {

	constructor() {
		cluster.on("online", (worker) => {
			worker.on("message", (data) => {
				if (!data.hotReload) {
					return;
				}
				this.restart();
			});
		});

		process.on("exit", () => {
			const safeExit = require("./worker/safe-exit");
			safeExit();
		});
	}

	async restart() {
		await lock.acquireAsync();
		global.restart = false;
		const workerList = global.workers;
		const num = global.workers.length;
		for (let i = 0; i < num; ++i) {
			const destroyWorker = workerList.shift();
			const forkWorker = cluster.fork();
			const bootstrap = new Promise(resolve => {
				forkWorker.on("online", resolve);
			});
			await bootstrap;
			workerList.push(forkWorker);
			destroyWorker.destroy();
		}
		lock.release();
		global.restart = true;
	}

	restartNotify() {
		process.send({
			hotReload: true
		});
		return this;
	}
}

module.exports = new HotReloadManager();
