import cluster from "cluster";
import { resolveHttpWorkers } from "../module/init/http_workers";

let num_processes = 0;

// Node 16 renamed isMaster->isPrimary and setupMaster->setupPrimary; the old
// names were removed in Node 24. Resolve whichever the running runtime exposes
// so the same build runs on Node 16 through the current LTS.
const clusterCompat: any = cluster;
const isPrimary: boolean =
    clusterCompat.isPrimary !== undefined ? clusterCompat.isPrimary : clusterCompat.isMaster;

function buildProcessErrorEvent() {
    process.on("unhandledRejection", error => {
        // Prints "unhandledRejection woops!"
        console.log("unhandledRejection", error);
    });
}

async function bootStrap() {
    global.currentDaemonName = "backend";
    buildProcessErrorEvent();

    if (isPrimary) {
        // Pin the worker entry explicitly. Node 24+ no longer reliably infers the
        // worker module from process.argv[1] under process managers like pm2, so
        // cluster.fork() would otherwise receive an undefined module path.
        const setupPrimary = clusterCompat.setupPrimary || clusterCompat.setupMaster;
        setupPrimary.call(clusterCompat, { exec: __filename });

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
        const workerDecision = resolveHttpWorkers(process.env, global.config);
        num_processes = workerDecision.count;
        console.log(`HTTP workers: ${num_processes} (source: ${workerDecision.source}, cpus: ${require("os").cpus().length})`);
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
