import {ILock} from "../module/common/Lock";

export default function Lock (lock: ILock) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]) {
            const lockKey = args[0] || "";
            await lock.getLock(lockKey);
            const response = method.apply(this, args);
            lock.release(lockKey);
            return response;
        }
    }
}
