import cluster from "cluster";
import os from "os";

const num_processes = Math.min(os.cpus().length, 32);

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
        if (!!global.config.enable_cluster_transfer) {
            require("../module/config/transfer/ClusterTransfer")();
        }
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

    } else {
        require("./websocket");
    }
}

bootStrap();
