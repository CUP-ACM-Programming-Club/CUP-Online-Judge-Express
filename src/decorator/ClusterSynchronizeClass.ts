export default function ClusterSynchronizeClass(target: any) {
    // save a reference to the original constructor
    const original = target;
    const className = target.name;
    // a utility function to generate instances of a class
    function construct(constructor: any, args: any[]) {
        const c: any = function (this: any) {
            return constructor.apply(this, args);
        };
        c.prototype = constructor.prototype;
        return new c();
    }

    // the new constructor behaviour
    const newConstructor: any = function (this: any, ...args: any[]) {
        const instance = construct(original, args);
        process.on("message", (data) => {
            if (data.className) {
                console.log(`message: ClassName:${data.className}, thisClassName:${className}`);
            }
            if (!data.className || data.className !== className) {
                return;
            }
            this.setWithTimestamp(...data.arguments, data.timestamp);
        });
        return instance;
    };

    // copy prototype so intanceof operator still works
    newConstructor.prototype = original.prototype;

    // return new constructor (will override original)
    return newConstructor;
}
