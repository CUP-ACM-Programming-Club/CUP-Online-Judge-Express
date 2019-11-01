import {Request} from "express";
function isAdministrator (req: Request) {
	return req && (<any>req.session) && !!(<any>req.session).isadmin;
}

module.exports = {
	isAdministrator
};
