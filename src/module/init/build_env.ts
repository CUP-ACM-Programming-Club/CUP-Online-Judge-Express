import fs from "fs";
import path from "path";
import {wait} from "../../decorator/RetryAsync";
import express from "express";
import isPromise from "is-promise";
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
	const _get = express.Router.prototype.get;
	const _post = express.Router.prototype.post;
	// Catch rejected async route handlers and hand the error to Express (500) instead of leaving the request hanging.
	// The old check isPromise(handler) was always false for a function, so nothing was ever wrapped.
	const wrapper = (fn: any) => (...args: any) => Promise.resolve().then(() => fn(...args)).catch((e: any) => {
		console.log("Catch error: ");
		console.log(e);
		console.log("argument: ", args);
		if (typeof args[2] === "function") {
			args[2](e);
		}
	});
	express.Router.prototype.get = function (...args: any[]) {
		const handler = args[args.length - 1];
		if (typeof handler === "function" && handler.length < 4) {
			args[args.length - 1] = wrapper(handler);
		}
		return _get.apply(this, args);
	}

	express.Router.prototype.post = function (...args: any[]) {
		const handler = args[args.length - 1];
		if (typeof handler === "function" && handler.length < 4) {
			args[args.length - 1] = wrapper(handler);
		}
		return _post.apply(this, args);
	}
	global.config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
	require("../../orm/instance/sequelize");
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
