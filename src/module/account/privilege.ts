import {Request} from "express";
export function isAdministrator (req: Request) {
	return req && (<any>req.session) && !!(<any>req.session).isadmin;
}
