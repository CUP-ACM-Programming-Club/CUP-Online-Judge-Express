export default function Timer(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
        const startTimeMill = Date.now();
        const response = method.apply(this, args);
        const endTimeMill = Date.now();
        console.log(`Method: ${propertyName} used ${endTimeMill - startTimeMill}ms.`);
        return response;
    }
}
