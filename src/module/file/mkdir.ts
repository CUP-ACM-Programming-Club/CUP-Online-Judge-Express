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

export const mkdirAsync = Bluebird.promisify(mkdir);
