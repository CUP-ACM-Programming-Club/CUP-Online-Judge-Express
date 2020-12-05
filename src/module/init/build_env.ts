import fs from "fs";
import path from "path";
import {wait} from "../../decorator/RetryAsync";
export = async function (TEST_MODE: boolean = false) {
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
