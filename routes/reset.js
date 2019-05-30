const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
router. use(...require("./reset/password"));
module.exports = ["/reset", auth, router];