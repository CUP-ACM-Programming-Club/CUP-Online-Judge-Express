export default function RuleChecker(ruleChecker: (...args: any) => void) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            ruleChecker(...args);
            return method.apply(this, args);
        }
    }
}
