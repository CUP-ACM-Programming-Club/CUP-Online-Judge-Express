import {default as cluster} from "cluster";
import AwaitLock from "await-lock";
import {IReload} from "./reload";

const lock = new AwaitLock();


export class BaseReload implements IReload {
    async tryFork() {
        const worker = cluster.fork();
        const alive = await new Promise(resolve => {
            setTimeout(() => {
                resolve(!worker.isDead());
            }, 3000);
        });
        if (alive) {
            worker.destroy();
        }
        return alive;
    }

    restart() {

    };

    restartNotify() {

    };
}
