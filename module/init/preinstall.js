const ENVIRONMENT = process.env.NODE_ENV;
const fs = require("fs");
module.exports = function(){
	if(ENVIRONMENT === "test") {
		if(!fs.existsSync("../../config.json")) {
			fs.copyFileSync("../../config-sample.json", "../../config.json");
		}
	}
};
