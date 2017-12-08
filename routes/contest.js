const express = require('express');
const router = express.Router();
const query = require('../module/mysql_query');
const NodeCache = require('node-cache');
const cache = new NodeCache({stdTTL: 10 * 24 * 60 * 60, checkperiod: 15 * 24 * 60 * 60});
router.get('/:cid', function (req, res, next) {

});
