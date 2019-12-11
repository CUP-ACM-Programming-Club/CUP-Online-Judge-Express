const cluster = require("cluster");

function main() {
	if (!global.clusterMode) {
		return;
	}
	const workers = global.workers;
	cluster.on("online", (worker) => {
		worker.on("message", (data) => {
			for (let i = 0; i < workers.length; ++i) {
				if (workers[i].process.pid !== worker.process.pid) {
					workers[i].send(data);
				}
			}
		});
	});
}

module.exports = main;
