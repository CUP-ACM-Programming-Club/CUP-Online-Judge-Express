import {Express} from "express";
import path from "path";
import fs from "fs";

module.exports = function (app: Express, _dir: string | undefined) {
	const basePath = path.resolve(__dirname, "../");
	const routerDir = typeof _dir !== "undefined" ? _dir : path.join(basePath, "routes");
	const routerFiles = fs.readdirSync(routerDir);
	routerFiles.forEach((fileName: string) => {
		if (path.extname(fileName) !== ".js") return;
		const routerArray = require(path.join(routerDir, fileName));
		if (typeof routerArray !== "undefined" && routerArray.length > 1 && typeof routerArray[0] === "string" && (<RegExpMatchArray>routerArray[0].match(/^\/[\s\S]*/)).length > 0) {
			// routerArray[0] = path.join("/api",routerArray[0]);
			app.use(...routerArray);
			routerArray[0] = path.join("/api", routerArray[0]);
			app.use(...routerArray);
		}
	});
};
