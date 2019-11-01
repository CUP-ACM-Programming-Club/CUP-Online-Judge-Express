const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
router.use(...require("./env/client"));

module.exports = ["/env", auth, router];