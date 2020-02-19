export default function (tryTime: number) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            while (tryTime--) {
                try {
                    return method.apply(this, args);
                } catch (e) {
                    console.log("Catch error: ", e);
                    console.log("Rest try time: ", tryTime);
                }
            }
        };
    }
}
