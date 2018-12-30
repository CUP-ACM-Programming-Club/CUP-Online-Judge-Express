const ENVIRONMENT = process.env.NODE_ENV;
const fs = require("fs");
const path = require("path");
const config_path = path.join(process.cwd(),"config.json");
const config_sample_path = path.join(process.cwd(),"config-sample.json");
module.exports = function(){
	if(ENVIRONMENT === "test") {
		if(!fs.existsSync(config_path)) {
			fs.copyFileSync(config_sample_path,config_path);
		}
	}
};
