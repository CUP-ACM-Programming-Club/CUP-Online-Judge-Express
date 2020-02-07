export interface IRuleCheckerResponse {
    result: boolean,
    reason: any
}
export default function RuleChecker(ruleChecker: (...args: any) => IRuleCheckerResponse) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            const checkResult = ruleChecker(...args);
        }

    }
}
