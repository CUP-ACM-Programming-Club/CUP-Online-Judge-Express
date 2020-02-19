import express from "express";
import path from "path";
const router = express.Router();
const auth = require("../middleware/auth");

require("../module/router_loader")(router, path.resolve(__dirname, "./reset"));
export = ["/reset", auth, router];
