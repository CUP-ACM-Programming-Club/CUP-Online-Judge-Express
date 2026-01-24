import express from "express";
const router = express.Router();
import path from "path";
const admin = require("../../middleware/admin");

require("../../module/router_loader")(router, path.resolve(__dirname, "./problem"));
module.exports = ["/problem", admin, router];
