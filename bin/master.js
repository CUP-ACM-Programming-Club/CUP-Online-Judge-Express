const cluster = require("cluster");
const net = require("net");

const num_processes = require("os").cpus().length;

if (cluster.isMaster) {
	const workers = [];
	global.workers = workers;
	global.clusterMode = true;
	require("../module/init/preinstall")();
	require("../module/init/build_env")();
	require("../module/config/transfer/ClusterTransfer")();
	require("../module/config/cluster/hot-reload");
	const config = global.config;
	const port = config.ws.http_client_port;
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
		destroy();
		process.exit(0);
	});

	//catches ctrl+c event
	process.on("SIGINT", () => {
		destroy();
		process.exit(0);
	});
	let idx = 0;
	// RoundRobin
	var worker_index = function (/* ip, len */) {
		return (idx = (idx + 1) % num_processes);
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
