import bluebird from "bluebird";
import fs from "fs";
import path from "path";

const fsAsync = bluebird.promisifyAll(fs);

function flipSuffix(file_name: string): string {
	if (file_name && file_name.length) {
		let pos: number;
		if ((pos = file_name.indexOf(".")) > 0) {
			return file_name.substring(0, pos);
		} else {
			return file_name;
		}
	}
	return "";
}

function flipNoneTextCode(text: string): string {
	return text.split("\n").join("").split(" ").join("");
}

async function fileToRawText(...file: string[]): Promise<any[]> {
	let result: any[] = [];
	for (let i in file) {
		result[path.basename(file[i]) as any] = (await (fsAsync as any).readFileAsync(file[i])).toString();
	}
	return result;
}

async function compareDiff(out: string, user: string): Promise<number> {
	if (user.length > out.length * 2) {
		return -1;
	}

	let judge_result = ((user: string, out: string) => {
		if (user.length !== out.length) {
			return 0;
		}
		const user_text = flipNoneTextCode(user);
		const out_text = flipNoneTextCode(out);
		if (user_text !== out_text) {
			return 0;
		}
		return 1;
	})(user, out);

	if (judge_result) {
		judge_result += ((user: string, out: string) => {
			if (user !== out) {
				return 0;
			}
			return 1;
		})(user, out);
	}
	return judge_result;
}

export { compareDiff, fileToRawText, flipSuffix };