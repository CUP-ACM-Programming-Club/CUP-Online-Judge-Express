import express from "express";
const router = express.Router();
import path from "path";
require("../../module/router_loader")(router, path.resolve(__dirname, "./contest"));
module.exports = ["/contest", router];