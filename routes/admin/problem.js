const express = require("express");
const router = express.Router();
router.use(...require("./problem/list"));
module.exports = ["/problem", router];