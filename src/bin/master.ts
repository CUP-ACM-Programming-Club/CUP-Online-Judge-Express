import cluster from "cluster";
import net from "net";
import os from "os";

const num_processes = Math.min(os.cpus().length, 16);

function buildProcessErrorEvent() {
    process.on("unhandledRejection", error => {
        // Prints "unhandledRejection woops!"
        console.log("unhandledRejection", error);
    });
}

async function bootStrap() {
    global.currentDaemonName = "backend";
    buildProcessErrorEvent();

    if (cluster.isMaster) {
        const workers: any[] = [];
        global.workers = workers;
        global.clusterMode = true;
        require("../module/init/preinstall")();
        require("../module/init/build_env")();
        require("../module/config/transfer/ClusterTransfer")();
        require("../module/config/cluster/hot-reload");
        // await require("../module/init/init-mysql").default();
        const config = global.config;
        const port = config.ws.http_client_port;
        let destroying = false;
        global.restart = true;
        const spawn = function (i: number) {
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

        const mod = function (num: number, div: number) {
            return num >= div ? num - div : num;
        };

        // RoundRobin
        const worker_index = function (/* ip, len */) {
            return (idx = mod(idx + 1, num_processes));
        };

        net
            .createServer({pauseOnConnect: true}, function (connection) {
                const worker = workers[worker_index()];
                worker.send("sticky-session:connection", connection);
            })
            .listen(port);

    } else {
        require("./websocket");
    }
}

bootStrap();
