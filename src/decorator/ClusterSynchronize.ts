export default function ClusterSynchronize (target: Object, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    const className = target.constructor.name;
    propertyDescriptor.value = function (...args: any[]) {
        const response = method.apply(this, args);
        const payload: any = {
            className,
            arguments: args,
            timestamp: Date.now()
        };
        process.send!(payload);
        return response;
    }
}
