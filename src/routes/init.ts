import express from "express";
import path from "path";
const router = express.Router();
require("../module/router_loader")(router, path.resolve(__dirname, "./init"));
export = ["/init", router];
