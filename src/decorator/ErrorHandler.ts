import {error} from "../module/constants/state";
import isPromise from "is-promise";
function errorHandle(err: any) {
    console.error(err);
    return error.internalError;
}

export function ErrorHandlerFactory(wrapper: (wrapObject: any) => any, errorHandlerWrapper?: (err: any) => any) {
    let errorHandlerFunction = errorHandle;
    if (typeof errorHandlerWrapper === "function") {
        return errorHandlerFunction = errorHandlerWrapper;
    }
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
