import {error} from "../module/constants/state";

function errorHandle(err: any) {
    console.error(err);
    return error.internalError;
}

export function ErrorHandlerFactory(wrapper?: (wrapObject: any) => any) {
    if (typeof wrapper !== "function") {
        wrapper = e => e;
    }
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            try {
                const result = method.apply(this, args);
                if (result instanceof Promise) {
                    return result.then(e => wrapper!(e)).catch(errorHandle);
                }
                else {
                    return wrapper!(result);
                }
            }
            catch (e) {
                return errorHandle(e);
            }
        }
    }
}

export const ErrorHandler = ErrorHandlerFactory();
