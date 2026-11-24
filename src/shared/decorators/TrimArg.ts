export default function TrimArg(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
        for(let i = 0; i < args.length; ++i) {
            if (typeof args[i] === "string") {
                args[i] = (args[i] as string).trim();
            }
        }
        return method.apply(this, args);
    }
}
