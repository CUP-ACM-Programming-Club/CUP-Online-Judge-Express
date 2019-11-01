const express = require("express");
const router = express.Router();
router.use("/stat",require("./system/sys_stat"));

module.exports = ["/system",  router];
