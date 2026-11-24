/**
 * 权限中间件。判定逻辑全部来自 ./predicates。
 */
import { Request, Response, NextFunction } from "express";
import { error } from "../module/constants/state";
import { isAdmin, Predicate } from "./predicates";

/**
 * 要求登录：即 auth 中间件（session 或 user_id+token cookie 登录、权限刷新、contest_mode 刷新、封禁检查）。
 * 未登录返回 error.nologin。
 */
export { default as requireLogin } from "../middleware/auth";

/** 要求管理员：同原 middleware/admin.ts，不满足返回 error.noprivilege（HTTP 200） */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (isAdmin(req)) {
		next();
	} else {
		res.json(error.noprivilege);
	}
}

/** 任一谓词为真即放行，否则 onDeny（缺省 res.json(error.noprivilege)） */
export function requireAnyOr(onDeny: (req: Request, res: Response) => void, ...predicates: Predicate[]) {
	return async function requireAny(req: Request, res: Response, next: NextFunction) {
		for (const predicate of predicates) {
			if (await predicate(req)) {
				return next();
			}
		}
		onDeny(req, res);
	};
}

/** 任一谓词为真即放行，否则 res.json(error.noprivilege) */
export function requireAny(...predicates: Predicate[]) {
	return requireAnyOr((req, res) => {
		res.json(error.noprivilege);
	}, ...predicates);
}
