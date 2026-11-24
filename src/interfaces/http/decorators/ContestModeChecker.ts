import {Request} from "express";
import {error} from "../../../domain/constants/state";
import { canBrowseSource } from "../../../domain/policy/predicates";

const checkPrivilege = (req: Request) => {
    return canBrowseSource(req);
};

export default function ContestModeChecker(requestPos: number) {
    return function (target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>) {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args: any[]) {
            const req: Request = args[requestPos];
            if (global.contest_mode && !checkPrivilege(req)) {
                throw error.contestMode;
            }
            return await method!.apply(this, args);
        }
    }
}
