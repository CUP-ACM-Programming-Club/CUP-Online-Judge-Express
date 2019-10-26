const cluster = require("cluster"),
	net = require("net");

const num_processes = require("os").cpus().length;

if (cluster.isMaster) {
	var workers = [];
	require("../module/init/preinstall")();
	require("../module/init/build_env")();
	const config = global.config;
	const port = config.ws.http_client_port;
	let restart = true;
	var spawn = function (i) {
		workers[i] = cluster.fork();
		workers[i].on("exit", function (code, signal) {
			if (restart) {
				console.log("respawning worker", i);
				spawn(i);
			}
		});
	};

	for (var i = 0; i < num_processes; i++) {
		spawn(i);
	}

	const destory = function () {
		restart = false;
		for (let i = 0; i < num_processes; i++) {
			workers[i].destroy();
			console.log(`destroy ${i}`);
		}
	};

	process.on("exit", () => {
		destory();
	});

	//catches ctrl+c event
	process.on("SIGINT", () => {
		destory();
	});	// ip hash
	var worker_index = function (ip, len) {
		var s = "";
		for (var i = 0, _len = ip.length; i < _len; i++) {
			if (!isNaN(ip[i])) {
				s += ip[i];
			}
		}

		return Number(s) % len;
	};

	var server = net.createServer({pauseOnConnect: true}, function (connection) {
		var worker = workers[worker_index(connection.remoteAddress, num_processes)];
		worker.send("sticky-session:connection", connection);
	}).listen(port);
} else {
	require("./main");
}
