import _ from "lodash";

export default function LodashDebounceDecoratorFactory(method: (...args: any[]) => any) {
    return function (wait?: number, options?: any) {
        return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
            const method = propertyDescriptor.value;
            propertyDescriptor.value = _.debounce(method, wait, options);
        }
    }
}
