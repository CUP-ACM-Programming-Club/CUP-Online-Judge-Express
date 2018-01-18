const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const path = require("path");

async function fileToRawText(...file){
	let result = [];
	for(let i in file){
		result.push({
			name:path.basename(file),
			data:await fs.readFileAsync(file[i]).toString()
		});
	}
	return result;
}

function compareDiff(result,...file_name){

}