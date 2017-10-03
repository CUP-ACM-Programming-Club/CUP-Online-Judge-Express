const express = require('express');
const NodeCache = require('node-cache');
const cache = new NodeCache({stdTTL: 10, checkperiod: 15});
const router = express.Router();
const query = require('../module/mysql_query');
router.get('/:source/:id', function (req, res, next) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        next();
    }
    else {
        next('route');
    }
}, function (req, res, next) {
    const errmsg = {
        status: "error",
        statement: "invalid parameter"
    };
    res.header('Content-Type', 'application/json');
    res.json(errmsg);
});

router.get('/:source/:id', function (req, res, next) {
    const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
    const id = parseInt(req.params.id);
    const _res = cache.get("source/id/" + source + id);
    if (_res === undefined) {
        console.log(id);
        if (source.length === 0) {
            query("SELECT * FROM problem WHERE problem_id=?", [id], (rows) => {
                if (rows.length !== 0) {
                    res.header('Content-Type', 'application/json');
                    res.json(rows[0]);
                    cache.set("source/id/" + source + id, rows[0], 10);
                }
                else {
                    const obj = {
                        msg: "404",
                        statement: "problem not found"
                    };
                    res.header('Content-Type', 'application/json');
                    res.json(obj);
                }
            })
        }
        else {
            query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?", [id, source], (rows) => {
                if (rows.length !== 0) {
                    res.header('Content-Type', 'application/json');
                    res.json(rows[0]);
                }
                else {
                    const obj = {
                        msg: "404",
                        statement: "problem not found"
                    };
                    res.header('Content-Type', 'application/json');
                    res.json(obj);
                }
            })
        }
    }
    else {
        res.header('Content-Type', 'application/json');
        res.json(_res);
    }
});

module.exports = router;
