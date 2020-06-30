export default function ErrorLogger (target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args: any[]) {
        try {
            return await method!.apply(this, args);
        }
        catch (e) {
            console.error(`ErrorLogger catch the error:${target.constructor.name}.${propertyName}`);
            console.error(`Argument is:`, args);
            console.error(`Error response:`, e);
        }
    }
}
