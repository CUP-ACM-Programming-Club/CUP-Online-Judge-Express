export default function ResponseLogger(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
        const response = method.apply(this, args);
        console.log(`${target.constructor.name}.${propertyName}\nargs:`);
        console.log(args);
        console.log(`response: `, response);
        return response;
    }
}
