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
    rawText.map((file,index) => {
        outputText[index] = file;
    });
}

module.exports = {
    compareDiff: compareDiff,
    fileToRawText: fileToRawText
};