const cluster = require("cluster");

function main() {
	if (!global.clusterMode) {
		return;
	}
	const workers = global.workers;
	cluster.on("online", (worker) => {
		worker.on("message", (data) => {
			if (!data.configManager) {
				return;
			}
			for (let i = 0; i < workers.length; ++i) {
				if (i !== worker.id) {
					workers[i].send(data);
				}
			}
		});
	});
}

module.exports = main;
