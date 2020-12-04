function wait(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(null), ms));
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
                    console.log("Catch error: ", e);
                    console.error(`RetryAsync catch the error:${target.constructor.name}.${propertyName}`);
                    console.error(`Argument is:`, args);
                    console.log("Rest tryAsync time: ", tryTime);
                    await wait(failDelay);
                }
            }
        }
    }
}
