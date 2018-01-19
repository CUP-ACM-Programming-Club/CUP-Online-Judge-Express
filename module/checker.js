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

function parseResult(result,pass_point){
	return {
		result:result,
		pass_point:pass_point
	};
}

async function fileToRawText(...file) {
	let result = [];
	for (let i in file) {
		result[path.basename(file)] = await fs.readFileAsync(file[i]).toString();
	}
	return result;
}

async function compareDiff(result, ...file_name) {
	const _result = JSON.parse(JSON.stringify(result));
	let userOutputText = [];
	_result.map((file, index) => {
		userOutputText[index] = file;
	});
	const rawText = await fileToRawText(...file_name);
	let outputText = [];
	rawText.map((file, index) => {
		outputText[index] = file;
	});

	let pass_point = 0;

	for(let i in userOutputText){
		if(userOutputText[i].length > outputText[i].left * 2){
			return parseResult(-1,pass_point);
		}
	}


	let judge_result = ((user, out) => {
		if (user.length !== out.length) {
			return 0;
		}
		for (let i in user) {
			const user_text = flipNoneTextCode(user[i]);
			const out_text = flipNoneTextCode(out_text[i]);
			if (user_text !== out_text) {
				return 0;
			}
			++pass_point;
		}
		return 1;
	})(userOutputText, outputText);
	if (judge_result) {
		pass_point = 0;
		judge_result += ((user, out) => {
			for (let i in user) {
				if (user[i] !== out[i]) {
					return 0;
				}
				++pass_point;
			}
			return 1;
		})(userOutputText, outputText);
	}
	return parseResult(judge_result,pass_point);
}

module.exports = {
	compareDiff: compareDiff,
	fileToRawText: fileToRawText
};