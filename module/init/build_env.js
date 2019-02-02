module.exports = function (TEST_MODE = false) {
	global.config = require("../../config.json");
	if(TEST_MODE) {
		setTimeout(function(){
			process.exit(0);
		},8000);
	}
};