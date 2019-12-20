export default function Tolerable(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
        try {
            return method.apply(this, args);
        }
        catch (e) {
            console.warn(`${target.constructor.name}.${propertyName} failed.`);
            console.warn(e);
        }
    }
}
