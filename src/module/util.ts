import * as crypto from "./encrypt";
import query = require("./mysql_query");
import isNumber from "./util/isNumber";

export function reverse(val: any): string {
	if (typeof val !== "string") {
		return (val + "").split("").reverse().join("");
	} else {
		return val.split("").reverse().join("");
	}
}

export function encryptPassword(rawPassword: string, salt: string): string {
	return crypto.encryptAES(rawPassword + salt, reverse(salt));
}

export function decryptPassword(encryptedPassword: string, salt: string): string {
	return reverse(reverse(crypto.decryptAES(encryptedPassword, reverse(salt))).substring(salt.length));
}

export function generateNewEncryptPassword(user_id: string, rawPassword: string, salt: string): Promise<any> {
	return new Promise((resolve, reject) => {
		query("update users set newpassword=? where user_id=?",
			[encryptPassword(rawPassword, salt), user_id])
			.then(resolve)
			.catch(reject);
	});
}

export function checkJSON(text: string): boolean {
	return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""));
}

export function trimProperty(target: any): any {
	for (const property in target) {
		if (Object.prototype.hasOwnProperty.call(target, property) && typeof target[property] === "string") {
			target[property] = target[property].trim();
		}
	}
	return target;
}

export function assertString(str: any): boolean {
	if (typeof str !== "string") {
		throw new Error("variable should be a string");
	}
	return true;
}

export function assertInt(num: any): number {
	if (!isNumber(num)) {
		throw new Error("variable should be a number");
	}
	return parseInt(num);
}

export async function removeAllContestProblem(contest_id: number | string): Promise<void> {
	await query("delete from contest_problem where contest_id = ?", [contest_id]);
}

export async function removeAllContestProblemWithTransaction(connection: any, contest_id: number | string): Promise<void> {
	await connection.query("delete from contest_problem where contest_id = ?", [contest_id]);
}

export async function removeAllCompetitorPrivilege(contest_id: number | string): Promise<void> {
	await query("delete from privilege where rightstr = ?", [`c${contest_id}`]);
}

export async function removeAllCompetitorPrivilegeWithTransaction(connection: any, contest_id: number | string): Promise<void> {
	await connection.query("delete from privilege where rightstr = ?", [`c${contest_id}`]);
}

export async function addContestProblem(contest_id: number | string, problemList: any[]): Promise<void> {
	let baseSql = "insert into contest_problem(contest_id, problem_id, num) values";
	let sqlArray: string[] = [];
	let valueArray: any[] = [];
	for (let num = 0, len = problemList.length; num < len; ++num) {
		sqlArray.push("(?,?,?)");
		valueArray.push(contest_id, problemList[num], num);
	}
	await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

export async function addContestProblemWithTransaction(connection: any, contest_id: number | string, problemList: any[]): Promise<void> {
	let baseSql = "insert into contest_problem(contest_id, problem_id, num) values";
	let sqlArray: string[] = [];
	let valueArray: any[] = [];
	for (let num = 0, len = problemList.length; num < len; ++num) {
		sqlArray.push("(?,?,?)");
		valueArray.push(contest_id, problemList[num], num);
	}
	await connection.query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

export async function addContestCompetitor(contest_id: number | string, userList: any[]): Promise<void> {
	if (userList.length === 0) {
		return;
	}
	let baseSql = "insert into privilege (user_id, rightstr) values";
	let sqlArray: string[] = [], valueArray: any[] = [];
	userList.forEach(el => {
		sqlArray.push("(?,?)");
		valueArray.push(el, `c${contest_id}`);
	});
	await query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

export async function addContestCompetitorWithTransaction(connection: any, contest_id: number | string, userList: any[]): Promise<void> {
	if (userList.length === 0) {
		return;
	}
	let baseSql = "insert into privilege (user_id, rightstr) values";
	let sqlArray: string[] = [], valueArray: any[] = [];
	userList.forEach(el => {
		sqlArray.push("(?,?)");
		valueArray.push(el, `c${contest_id}`);
	});
	await connection.query(`${baseSql} ${sqlArray.join(",")}`, valueArray);
}

export function startupInit(): Promise<any> {
	return query("UPDATE solution SET result = 1 WHERE result > 0 and result < 4");
}
