export default function (tryTime: number) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]) {
            while (tryTime--) {
                try {
                    return await method.apply(this, args);
                } catch (e) {
                    console.log("Catch error: ", e);
                    console.log("Rest tryAsync time: ", tryTime);
                }
            }
        }
    }
}
