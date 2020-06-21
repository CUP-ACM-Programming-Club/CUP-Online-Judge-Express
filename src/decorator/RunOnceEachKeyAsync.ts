import parameterHash from "../module/util/parameterHash";
import CachePool from "../module/common/CachePool";

export default function RunOnceEachKeyAsync(target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) {
    const method = propertyDescriptor.value;
    const cache = new CachePool();
    propertyDescriptor.value = async function (...args: any[]) {
        const cacheKey = parameterHash(args);
        if (!(await cache.get(cacheKey))) {
            await cache.set(cacheKey, 0);
            return await method!.apply(this, args);
        }
    }
}
