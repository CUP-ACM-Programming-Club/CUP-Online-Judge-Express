const express = require("express");
const router = express.Router();
router.use(...require("./contest/list"));
module.exports = ["/contest", router];