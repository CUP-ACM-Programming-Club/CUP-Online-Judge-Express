import express from "express";
import path from "path";
const router = express.Router();
import auth from "../middleware/auth";
console.log("AUTH TYPE in Admin:", typeof auth, auth);
require("../module/router_loader")(router, path.resolve(__dirname, "./admin"));

export = ["/admin", auth, router];
