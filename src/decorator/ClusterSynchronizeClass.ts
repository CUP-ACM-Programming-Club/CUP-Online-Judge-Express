export default function ClusterSynchronizeClass<T extends { new(...constructorArgs: any[]): any }>(constructorFunction: T) {
    // save a reference to the original constructor
    let newConstructorFunction: any = function (this: any, ...args: any[]) {
        let func: any = function () {
            return new constructorFunction(...args);
        };
        func.prototype = constructorFunction.prototype;
        let result: any = new func();
        const className = constructorFunction.name;
        process.on("message", (data) => {
            if (!data.className || data.className !== className) {
                return;
            }
            this.setWithTimestamp(...data.arguments, data.timestamp);
        });
        return result;
    };
    newConstructorFunction.prototype = constructorFunction.prototype;
    return newConstructorFunction;
}
