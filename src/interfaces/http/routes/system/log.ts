import express from "express";
import path from "path";

const router = express.Router();
const admin = require("../../middleware/admin");
require("../../router_loader")(router, path.resolve(__dirname, "./log"));

export = ["/log", admin, router];
