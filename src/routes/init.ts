import express from "express";
import path from "path";
import InitMiddleware from "../middleware/init/InitMiddleware";

const router = express.Router();
require("../module/router_loader")(router, path.resolve(__dirname, "./init"));
export = ["/init", InitMiddleware, router];
