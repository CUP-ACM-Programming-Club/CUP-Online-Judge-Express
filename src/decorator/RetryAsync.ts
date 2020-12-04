import Logger from "../module/console/Logger";

function wait(ms: number) {
    return new Promise(resolve => setTimeout(() => { Logger.log(`failDelay: ${ms}`); resolve(null) }, ms));
}

export default function (tryTime: number, delay?: number) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        const failDelay = delay || 100;
        propertyDescriptor.value = async function (...args: any[]) {
            while (tryTime-- > 0) {
                try {
                    return await method.apply(this, args);
                } catch (e) {
                    Logger.log("Catch error: ", e);
                    Logger.log(`RetryAsync catch the error:${target.constructor.name}.${propertyName}`);
                    Logger.log(`Argument is:`, args);
                    Logger.log("Rest tryAsync time: ", tryTime);
                    await wait(failDelay);
                }
            }
        }
    }
}
