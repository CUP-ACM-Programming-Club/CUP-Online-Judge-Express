import fs from "fs";
import path from "path";
import Bluebird from "bluebird";

export function mkdir(dirname: string, callback: () => void) {
	fs.access(dirname, function (err) {
		if (!err) {
			callback();
		} else {
			mkdir(path.dirname(dirname), function () {
				fs.mkdir(dirname, callback);
			});
		}
	});
}

export async function mkdirAsync(dirname: string) {
	try {
		await fs.promises.access(dirname);
	}
	catch (e) {
		await mkdirAsync(path.dirname(dirname));
		await fs.promises.mkdir(dirname);
	}
}
