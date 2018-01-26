/* eslint-disable no-unused-vars */
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const path = require("path");

function flipSuffix(file_name) {
	if (file_name && file_name.length) {
		let pos;
		if ((pos = file_name.indexOf(".")) > 0) {
			return file_name.substring(0, pos);
		}
		else {
			return file_name;
		}
	}
}

function flipNoneTextCode(text) {
	return text.split("\n").join("").split(" ").join("");
}


async function fileToRawText(...file) {
	let result = [];
	for (let i in file) {
		result[path.basename(file)] = await fs.readFileAsync(file[i]).toString();
	}
	return result;
}

async function compareDiff(out, user) {

	if (user.length > out.length * 2) {
		return -1;
	}


	let judge_result = ((user, out) => {
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
		judge_result += ((user, out) => {
			if (user !== out) {
				return 0;
			}
			return 1;
		})(user, out);
	}
	return judge_result;
}

module.exports = {
	compareDiff: compareDiff,
	fileToRawText: fileToRawText
};