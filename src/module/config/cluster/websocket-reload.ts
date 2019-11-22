import cluster, {Worker} from "cluster";
import AwaitLock from "await-lock";
import dayjs, {Dayjs} from "dayjs";
import {IReload} from "./reload";
import {BaseReload} from "./BaseReload";
const lock = new AwaitLock();
interface HotReloadMethod {
    [id: string]: (...args: any[]) => any
}

interface IVersion {
    version: Dayjs
}

class WebsocketReload extends BaseReload implements IReload {
    protected instance: IVersion = {
        version: dayjs()
    };
    constructor () {
        super();
        const method: HotReloadMethod = {
            "restart": this.restart
        };
        if (cluster.isMaster) {
            cluster.on("online", (worker: Worker) => {
                worker.on("message", (data) => {
                    if (!data.websocketReload) {
                        return;
                    }
                    method[data.method].apply(this, data.arg || []);
                });
            });
        }
        else {
            this.instance = {
                version: dayjs()
            }
        }

        process.on("exit", () => {
            const safeExit = require("./worker/safe-exit");
            safeExit();
        })
    }

    async tryFork() {
        const worker = cluster.fork();
        const alive = await new Promise(resolve => {
            setTimeout(() => {resolve(!worker.isDead())}, 3000);
        });
        if (alive) {
            worker.destroy();
        }
        return alive;
    }

    restartNotify () {
        process.send!({
            websocketReload: true,
            method: "restart"
        });
        return this;
    }

    async restart () {
        await lock.acquireAsync();
        const forkTest = await this.tryFork();
        if (!forkTest) {
            return;
        }
    }
}

export default new WebsocketReload();
