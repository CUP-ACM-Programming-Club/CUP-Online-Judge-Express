import CachePool from "../module/common/CachePool";
import AwaitLock from "await-lock";
import dayjs, {OpUnitType} from "dayjs";
import md5 from "../module/util/md5";

function cacheMapToString (payload: any): string {
    if (typeof payload === "string") {
        return payload;
    }
    else if (typeof payload === "number") {
        return payload.toString();
    }
    else if (typeof payload === "undefined") {
        return "undefined";
    }
    else if (payload === null) {
        return "null";
    }
    else {
        return md5(JSON.stringify(payload));
    }
}

export default function Cacheable(cachePool: CachePool, timeDelta: number, timeUnit: OpUnitType) {
    const cacheLock = new AwaitLock();
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]) {
            if (!Array.isArray(args) || args.length === 0) {
                args = [""];
            }
            const cacheKey = args.map(cacheMapToString).reduce((accumulator, currentValue) => accumulator + currentValue);
            const cache = await cachePool.get(cacheKey);
            if (cache && dayjs().subtract(timeDelta, timeUnit).isBefore(cache.time)) {
                // console.log(`Hit cache data: ${propertyName}`);
                return cache.data;
            }
            else {
                // console.log(`Miss cache data: ${propertyName}`);
                const response = await method.apply(this, args);
                try {
                    await cacheLock.acquireAsync();
                    await cachePool.set(cacheKey, response);
                    return response;
                }
                catch (e) {
                    console.error("Cacheable failed: ", propertyName);
                    console.log(e);
                    return null;
                }
                finally {
                    cacheLock.release();
                }
            }
        }
    }
}
