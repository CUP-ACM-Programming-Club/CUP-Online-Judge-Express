import * as crypto from "../shared/encrypt";
import { userRepository } from "./ports/UserRepository";
import { legacyUtilRepository } from "./ports/LegacyUtilRepository";
import isNumber from "../shared/isNumber";

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
		userRepository.updateNewPassword(user_id, encryptPassword(rawPassword, salt))
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
	await legacyUtilRepository.removeAllContestProblem(contest_id);
}

export async function removeAllContestProblemWithTransaction(connection: any, contest_id: number | string): Promise<void> {
	await legacyUtilRepository.removeAllContestProblemWithTransaction(connection, contest_id);
}

export async function removeAllCompetitorPrivilege(contest_id: number | string): Promise<void> {
	await legacyUtilRepository.removeAllCompetitorPrivilege(contest_id);
}

export async function removeAllCompetitorPrivilegeWithTransaction(connection: any, contest_id: number | string): Promise<void> {
	await legacyUtilRepository.removeAllCompetitorPrivilegeWithTransaction(connection, contest_id);
}

export async function addContestProblem(contest_id: number | string, problemList: any[]): Promise<void> {
	await legacyUtilRepository.addContestProblem(contest_id, problemList);
}

export async function addContestProblemWithTransaction(connection: any, contest_id: number | string, problemList: any[]): Promise<void> {
	await legacyUtilRepository.addContestProblemWithTransaction(connection, contest_id, problemList);
}

export async function addContestCompetitor(contest_id: number | string, userList: any[]): Promise<void> {
	await legacyUtilRepository.addContestCompetitor(contest_id, userList);
}

export async function addContestCompetitorWithTransaction(connection: any, contest_id: number | string, userList: any[]): Promise<void> {
	await legacyUtilRepository.addContestCompetitorWithTransaction(connection, contest_id, userList);
}

export function startupInit(): Promise<any> {
	return legacyUtilRepository.startupInit();
}
