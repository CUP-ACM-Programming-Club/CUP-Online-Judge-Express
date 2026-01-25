import express from "express";
import path from "path";
const router = express.Router();
import auth from "../middleware/auth";

require("../module/router_loader")(router, path.resolve(__dirname, "./reset"));
export = ["/reset", auth, router];
