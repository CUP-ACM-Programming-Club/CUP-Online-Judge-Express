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
	}

	async restart() {
		await lock.acquireAsync();
		global.restart = false;
		const workerList = global.workers;
		const num = global.workers.length;
		for (let i = 0; i < num; ++i) {
			const destroyWorker = workerList.shift();
			const forkWorker = cluster.fork();
			const promise = new Promise(resolve => {
				forkWorker.on("online", resolve);
			});
			await promise;
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
