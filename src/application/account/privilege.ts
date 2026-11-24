import {Request} from "express";
import { isAdmin } from "../../domain/policy/predicates";

/** 功能开关拦截器的“管理员绕过”判断，见 src/policy */
export function isAdministrator (req: Request) {
	return isAdmin(req);
}
