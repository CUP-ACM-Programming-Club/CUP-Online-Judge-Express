import CachePool from "../module/common/CachePool";
import AwaitLock from "await-lock";
import dayjs, {ManipulateType, OpUnitType} from "dayjs";
import parameterHash from "../module/util/parameterHash";
import CacheScheduler from "../manager/cache/scheduler/CacheScheduler";

export default function Cacheable(cachePool: CachePool, timeDelta: number, timeUnit?: ManipulateType) {
    const cacheLock = new AwaitLock();
    CacheScheduler.addCacheContainer({
        cacheContainer: cachePool,
        timeDelta,
        timeUnit
    });
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]) {
            if (!Array.isArray(args) || args.length === 0) {
                args = [""];
            }
            const cacheKey = args.map(parameterHash).reduce((accumulator, currentValue) => accumulator + currentValue);
            const cache = await cachePool.get(cacheKey);
            if (cache && dayjs().subtract(timeDelta, timeUnit).isBefore(cache.time)) {
                // console.log(`Hit cache data: ${propertyName}`);
                return cache.data;
            }
            else {
                // console.log(`Miss cache data: ${propertyName}`);
                const response = await method.apply(this, args);
                if (response !== null && response !== undefined) {
                    try {
                        await cacheLock.acquireAsync();
                        await cachePool.set(cacheKey, response);
                        return response;
                    } catch (e) {
                        console.error("Cacheable failed: ", propertyName);
                        console.log(e);
                        return null;
                    } finally {
                        cacheLock.release();
                    }
                }
                else {
                    return response;
                }
            }
        }
    }
}
