/** ProblemResultCache 的实现：进程内 node-cache。 */
import { ProblemResultCache } from "../../application/ports/ProblemResultCache";

const cache = require("./nodeCache");

export class NodeProblemResultCache implements ProblemResultCache {
    get(key: string) {
        return cache.get(key);
    }

    set(key: string, value: any, ttlSeconds: number) {
        cache.set(key, value, ttlSeconds);
    }
}
