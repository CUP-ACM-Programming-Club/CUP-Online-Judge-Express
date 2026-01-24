import { Express } from "express";
import path from "path";
import fs from "fs";

module.exports = function (app: Express, _dir: string | undefined) {
	const basePath = path.resolve(__dirname, "../");
	const routerDir = typeof _dir !== "undefined" ? _dir : path.join(basePath, "routes");
	const routerFiles = fs.readdirSync(routerDir);
	routerFiles.forEach((fileName: string) => {
		const ext = path.extname(fileName);
		if (ext !== ".js" && ext !== ".ts") return;
		if (ext === ".ts" && fileName.endsWith(".d.ts")) return;
		const routerArray = require(path.join(routerDir, fileName));
		const rawRoute = typeof routerArray !== "undefined" && typeof routerArray[0] === "string" ? routerArray[0] : "";
		const routePath = rawRoute.replace(/\\/g, "/");
		const match = routePath.match(/^\/[\s\S]*/);
		if (typeof routerArray !== "undefined" && routerArray.length > 1 && typeof routePath === "string" && match && match.length > 0) {
			// routerArray[0] = path.join("/api",routerArray[0]);
			try {
				const baseMount = [routePath].concat(routerArray.slice(1));
				app.use(...(baseMount as any));
				if (_dir === undefined) {
					const apiMount = [path.join("/api", routePath)].concat(routerArray.slice(1));
					app.use(...(apiMount as any));
				} else {
					app.use(...(baseMount as any));
				}
			}
			catch (e) {
				console.error(`Loading router caused error, routerArray: ${routerArray}`);
				console.error(e);
				console.error("");
			}
		}
	});
};
