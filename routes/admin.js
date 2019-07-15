const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const path = require("path");
require("../module/router_loader")(router, path.resolve(__dirname, "./admin"));

module.exports = ["/admin", auth, admin, router];