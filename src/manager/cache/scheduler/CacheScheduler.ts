import {ICachePool} from "../../../module/common/CachePool";
import dayjs, {OpUnitType} from "dayjs";

interface ICacheContainer {
    cacheContainer: ICachePool,
    timeDelta: number,
    timeUnit: OpUnitType
}

class CacheScheduler {
    cacheContainerList: ICacheContainer[] = [];
    intervals: NodeJS.Timeout;
    constructor() {
        this.intervals = setInterval(async () => {
            for (let cacheContainerListElement of this.cacheContainerList) {
                const timeDelta = cacheContainerListElement.timeDelta;
                const timeUnit = cacheContainerListElement.timeUnit;
                const cacheContainer = cacheContainerListElement.cacheContainer;
                for (let k of cacheContainer.getAllKey()) {
                    const cache = await cacheContainer.get(k);
                    if (cache && cache.time) {
                        const expired = !dayjs().subtract(timeDelta, timeUnit).isBefore(cache!.time);
                        if (expired) {
                            cacheContainer.remove(k);
                        }
                    }
                }
            }
        }, 60 * 1000);
    }


    addCacheContainer(cachePool: ICacheContainer) {
        this.cacheContainerList.push(cachePool);
    }
}

export default new CacheScheduler();
