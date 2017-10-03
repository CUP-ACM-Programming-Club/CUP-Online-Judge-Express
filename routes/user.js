const express = require('express');
const NodeCache = require('node-cache');
const router = express.Router();
const query = require('../module/mysql_query');
const cache = new NodeCache({stdTTL: 10, checkperiod: 15});

router.get('/:user_id', function (req, res, next) {
    const user_id = req.params.user_id;
    const _detail = cache.get("user_id" + user_id);
    if (_detail === undefined) {
        query("SELECT submit,solved,email,nick,school from users where user_id=?", [user_id], (rows) => {
            if (rows.length !== 0) {
                const usr = rows[0];
                const user_detail = {
                    submit: usr['submit'],
                    solved: usr['solved'],
                    email: usr['email'],
                    nick: usr['nick'],
                    school: usr['school']
                };
                cache.set("user" + user_id, user_detail, 10);
                res.header('Content-Type', 'application/json');
                res.json(user_detail);
            }
            else {

                const obj = {
                    status: "ERROR",
                    statement: "user not found"
                };
                res.header('Content-Type', 'application/json');
                res.json(obj);
            }
        });
    }
    else {
        res.header('Content-Type', 'application/json');
        res.json(_detail);
    }
});

router.get('/nick/:nick', function (req, res, next) {
    const nick = req.params.nick;
    const _user = cache.get("nick" + nick);
    if (_user === undefined) {
        query("SELECT user_id FROM users WHERE nick=?", [nick], (rows) => {
            if (rows.length !== 0) {
                const user = {
                    status: "OK",
                    user_id: rows[0]['user_id']
                };
                cache.set("nick" + nick, user, 10);
                res.header('Content-Type', 'application/json');
                res.json(user);
            }
            else {
                const obj = {
                    status: "ERROR",
                    user_id: "null"
                };
                res.header('Content-Type', 'application/json');
                res.json(obj);
            }
        });
    }
    else {
        res.header('Content-Type', 'application/json');
        res.json(_user);
    }
});

router.get('/:user_id/submit', function (req, res, next) {
    const user_id = req.params.user_id;
    const _format = cache.get("user_id/submit" + user_id);
    if (_format === undefined) {
        query("SELECT * FROM solution WHERE user_id=?", [user_id], (rows) => {
            let formatArr = [];
            const len = rows.length;
            for (let i = 0; i < len; ++i) {
                let obj = {
                    result: rows[i]['result'],
                    problem_id: rows[i]['problem_id']
                };
                formatArr.push(obj);
            }
            res.header('Content-Type', 'application/json');
            res.json(formatArr);
        });
    }
    else {
        res.header('Content-Type', 'application/json');
        res.json(_format);
    }
});

module.exports = router;