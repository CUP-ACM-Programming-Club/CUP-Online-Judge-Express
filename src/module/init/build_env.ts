import fs from "fs";
import path from "path";
export = function (TEST_MODE: boolean = false) {
	global.config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config.json"), "utf-8"));
	require("../../orm/instance/sequelize");
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
