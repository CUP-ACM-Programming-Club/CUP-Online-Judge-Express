const express = require("express");
const router = express.Router();
const path = require("path");
require("../../module/router_loader")(router, path.resolve(__dirname, "./problem"));
module.exports = ["/problem", router];