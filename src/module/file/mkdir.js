const fs = require("fs");
const path = require("path");

function mkdir(dirname, callback) {
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

const mkdirAsync = require("bluebird").promisify(mkdir);

module.exports = {mkdir, mkdirAsync};
