module.exports = function (TEST_MODE = false) {
	global.config = require("../../config.json");
	if(TEST_MODE) {
		setTimeout(function(){
			process.exit(0);
		},8000);
	}
	String.prototype.exist = function (str) {
		return this.indexOf(str) !== -1;
	};
	Array.prototype.isEmpty = function () {
		return this.length === 0;
	};
};