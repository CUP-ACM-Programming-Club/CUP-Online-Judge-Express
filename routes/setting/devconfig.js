const express = require("express");
const router = express.Router();
const {error, ok} = require("../../module/constants/state");
const ConfigManager = require("../../manager/ConfigManager/index");

function validator(key) {
	if (typeof key !== "string" || key.length === 0) {
		throw new Error("key should be a valid value");
	}
}

function handleConfigFactory(fn) {
	return function (req, res) {
		try {
			const {key, value, comment} = req.body;
			validator(key, value, comment);
			fn.call(ConfigManager, key, value, comment);
			res.json(ok.ok);
		} catch (e) {
			console.log(e);
			res.json(error.invalidParams);
		}
	};
}

router.get("/config", (req, res) => {
	res.json(ok.okMaker(ConfigManager.getAllConfig()));
});

router.get("/switch", (req, res) => {
	res.json(ok.okMaker(ConfigManager.getAllSwitch()));
});

router.post("/config/update", (req, res) => {
	handleConfigFactory(ConfigManager.setConfig)(req, res);
});

router.post("/switch/update", (req, res) => {
	handleConfigFactory(ConfigManager.setSwitch)(req, res);
});

router.post("/config/delete", (req, res) => {
	handleConfigFactory(ConfigManager.removeConfig)(req, res);
});

router.post("/switch/delete", (req, res) => {
	handleConfigFactory(ConfigManager.removeSwitch)(req, res);
});

module.exports = ["/devconfig", router];
