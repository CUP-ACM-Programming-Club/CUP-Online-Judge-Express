import {Request} from "express";
import {error} from "../module/constants/state";
const checkCaptcha = require("../module/captcha_checker").checkCaptcha;
export default function CaptchaChecker(requestPosition: number, captchaFrom: string) {
    return function (target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function (...args: any[]) {
            const request: Request = args[requestPosition];
            if (!checkCaptcha(request, captchaFrom)) {
                return error.invalidCaptcha;
            }
            return method.apply(this, args);
        }
    }
}
