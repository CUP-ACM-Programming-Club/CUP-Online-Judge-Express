const cluster = require("cluster");
const net = require("net");

const num_processes = require("os").cpus().length;
async function bootStrap() {

	if (cluster.isMaster) {
		const workers = [];
		global.workers = workers;
		global.clusterMode = true;
		require("../module/init/preinstall")();
		require("../module/init/build_env")();
		require("../module/config/transfer/ClusterTransfer")();
		require("../module/config/cluster/hot-reload");
		await require("../module/init/init-mysql").default();
		const config = global.config;
		const port = config.ws.http_client_port;
		let destroying = false;
		global.restart = true;
		const spawn = function (i) {
			workers[i] = cluster.fork();
			workers[i].on("exit", function (/* code, signal */) {
				if (global.restart) {
					console.log("respawning worker", i);
					spawn(i);
				}
			});
		};

		for (let i = 0; i < num_processes; ++i) {
			spawn(i);
		}

		const destroy = function () {
			global.restart = false;
			for (let i = 0; i < num_processes; i++) {
				workers[i].destroy();
				console.log(`destroy ${i}`);
			}
		};

		process.on("exit", () => {
			if (destroying) {
				return;
			}
			destroying = true;
			destroy();
			process.exit(0);
		});

		//catches ctrl+c event
		process.on("SIGINT", () => {
			if (destroying) {
				return;
			}
			destroying = true;
			destroy();
			process.exit(0);
		});
		let idx = 0;

		const mod = function (num, div) {
			return num >= div ? num - div : num;
		};

		// RoundRobin
		const worker_index = function (/* ip, len */) {
			return (idx = mod(idx + 1, num_processes));
		};

		net
			.createServer({pauseOnConnect: true}, function (connection) {
				const worker = workers[worker_index(connection.remoteAddress, num_processes)];
				worker.send("sticky-session:connection", connection);
			})
			.listen(port);

	} else {
		require("./main");
	}
}

bootStrap();
