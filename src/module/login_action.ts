import query = require("./mysql_query");
import { Request } from "express";

function isAdmin(str: string): boolean {
	return str === "administrator";
}

function isEditor(str: string): boolean {
	return str.indexOf("editor") === 0;
}

function isContestManager(str: string): boolean {
	return str.indexOf("contest_manager") === 0;
}

function isSourceBrowser(str: string): boolean {
	return str.indexOf("source_browser") === 0;
}

function isContestUser(str: string): boolean {
	return str.indexOf("c") === 0;
}

function isContestMaker(str: string): boolean {
	return str.indexOf("m") === 0;
}

function isProblemMaker(str: string): boolean {
	return str.indexOf("p") === 0;
}

const defaultPrivilege = {
	auth: true,
	contest_manager: false,
	editor: false,
	isadmin: false,
	source_browser: false
};

async function loginAction(req: Request, user_id: string): Promise<void> {
	if (!req.session) return;
	Object.assign(req.session, defaultPrivilege);
	(req.session as any).user_id = user_id;
	(req.session as any).contest = {};
	(req.session as any).contest_maker = {};
	(req.session as any).problem_maker = {};
	let [val, nick] = await Promise.all([
		query("select rightstr from privilege where user_id = ?", [user_id]),
		query("select nick,avatar,avatarUrl,email from users where user_id = ?", [user_id])
	]) as [any[], any[]];

	// for session admin privilege
	if (nick && nick.length && nick.length > 0) {
		(req.session as any).nick = nick[0].nick;
		(req.session as any).avatar = nick[0].avatar;
		(req.session as any).avatarUrl = nick[0].avatarUrl;
		(req.session as any).email = nick[0].email;
	}
	for (let i of val) {
		if (isAdmin(i.rightstr)) {
			(req.session as any).isadmin = true;
		} else if (isEditor(i.rightstr)) {
			(req.session as any).editor = true;
		} else if (isContestManager(i.rightstr)) {
			(req.session as any).contest_manager = true;
		} else if (isSourceBrowser(i.rightstr)) {
			(req.session as any).source_browser = true;
		} else if (isContestUser(i.rightstr)) {
			(req.session as any).contest[i.rightstr] = true;
		} else if (isContestMaker(i.rightstr)) {
			(req.session as any).contest_maker[i.rightstr] = true;
		} else if (isProblemMaker(i.rightstr)) {
			(req.session as any).problem_maker[i.rightstr] = true;
		}
	}
}

export = loginAction;
