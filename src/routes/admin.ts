import express from "express";
import path from "path";
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
require("../module/router_loader")(router, path.resolve(__dirname, "./admin"));

export = ["/admin", auth, admin, router];
