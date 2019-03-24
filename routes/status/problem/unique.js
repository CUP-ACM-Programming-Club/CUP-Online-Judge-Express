const express = require("express");
const router = express.Router();
const [error] = require("../../../module/const_var");
const cache_query = require("../../../module/mysql_cache");

router.get("/all", async (req, res) => {

});

router.get("/problem/:problem_id", async (req, res) => {

});

module.exports = ["/unique", router];
