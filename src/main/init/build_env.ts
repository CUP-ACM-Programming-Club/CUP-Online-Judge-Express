import fs from "fs";
import path from "path";
import {wait} from "../../shared/decorators/RetryAsync";
import express from "express";
import log4j from "./log4j"

console.log = function (message: any, ...args: any[]) {
	return log4j.info(message, args);
}

console.warn = function (message: any, ...args: any[]) {
	return log4j.warn(message, args);
}

console.error = function (message: any, ...args: any[]) {
	return log4j.error(message, args);
}

export = async function (TEST_MODE: boolean = false) {
	// Catch rejected async route handlers and hand the error to Express (500) instead of leaving the request hanging.
	// Two old bugs made this a no-op: isPromise(handler) is always false for a function, and Express routers inherit
	// their methods from the express.Router function object itself, not from express.Router.prototype.
	const wrapper = (fn: any) => (...args: any) => Promise.resolve().then(() => fn(...args)).catch((e: any) => {
		console.log("Catch error: ");
		console.log(e);
		console.log("argument: ", args);
		if (typeof args[2] === "function") {
			args[2](e);
		}
	});
	const routerProto: any = express.Router;
	for (const method of ["get", "post", "put", "delete", "patch"]) {
		const original = routerProto[method];
		if (typeof original !== "function" || original.__kcWrapped) {
			continue;
		}
		const patched = function (this: any, ...args: any[]) {
			const handler = args[args.length - 1];
			if (typeof handler === "function" && handler.length < 4) {
				args[args.length - 1] = wrapper(handler);
			}
			return original.apply(this, args);
		};
		(patched as any).__kcWrapped = true;
		routerProto[method] = patched;
	}
	global.config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
	require("../../infrastructure/orm/instance/sequelize");
	await wait(2000);
	if(TEST_MODE) {
		setTimeout(function(){
			process.exit(0);
		},8000);
	}

	if (typeof process.send !== "function") {
		// @ts-ignore
		process.send = function (...args: any) {

		}
	}
	// @ts-ignore
	String.prototype.exist = function (str: string) {
		return this.indexOf(str) !== -1;
	};
	// @ts-ignore
	Array.prototype.isEmpty = function () {
		return this.length === 0;
	};
};
