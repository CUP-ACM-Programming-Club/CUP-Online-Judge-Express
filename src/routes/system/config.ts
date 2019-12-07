import express, {Router} from "express";
import path from "path";
const router: Router = express.Router();
const routerLoader = require( "../module/router_loader");

routerLoader(router, path.resolve(__dirname, "./config"));

module.exports = ["/config", router];
