import express from "express";
const router = express.Router();
import path from "path";
const admin = require("../../middleware/admin");
require("../../router_loader")(router, path.resolve(__dirname, "./account"));
module.exports = ["/account", admin, router];
