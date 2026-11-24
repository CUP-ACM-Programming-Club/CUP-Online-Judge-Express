import isPromise from "is-promise";
function errorHandle(err: any) {
    console.error(err);
    // 与 domain/constants/state 的 error.errorMaker 返回同一结构；shared 层不依赖 domain
    return {status: "error", statement: err && err.message ? err.message : err};
}

export function ErrorHandlerFactory(wrapper: (wrapObject: any) => any) {
    let errorHandlerFunction = errorHandle;
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            try {
                const result = method.apply(this, args);
                if (isPromise(result)) {
                    return (result as Promise<any>).then(e => wrapper!(e)).catch(errorHandlerFunction);
                }
                else {
                    return wrapper!(result);
                }
            }
            catch (e) {
                return errorHandlerFunction(e);
            }
        }
    }
}

export const ErrorHandler = ErrorHandlerFactory(e => e);
