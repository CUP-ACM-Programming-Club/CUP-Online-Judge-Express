const express = require("express");
const path = require("path");
const oneDay = 86400000;
module.exports = ["/static", express.static(path.join(process.cwd(), "static"), {
	maxAge: oneDay * 30
})];
