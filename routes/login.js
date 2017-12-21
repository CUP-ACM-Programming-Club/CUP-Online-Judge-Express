const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const checkPassword = require("../module/check_password");
const log4js = require("../module/logger");
const log = log4js.logger('cheese', 'info');
const crypto = require('../module/encrypt');
const memcache = require('../module/memcached');
const [error, ok] = require('../module/const_var');
const salt = "thisissalt";


const reverse = (val) => {
    return val.toString().split("").reverse().join("");
};
router.post("/token", function (req, res, next) {
    if (typeof req.body.token !== "string") {
        res.json(error.invalidToken);
    }
    else {
        next('route');
    }
});
router.post("/token", async function (req, res) {
    if (req.session.auth) {
        res.json(ok.logined);
    }
    else {
        // console.log(req.body.token);
        let receive = "";
        try {
            receive = Buffer.from(req.body.token, "base64").toString();
        }
        catch (e) {
            log.fatal(e);
            return;
        }
        log.info(receive);
        const token = JSON.parse(receive);
        const token_str = token['token'] || "";
        const data = await memcache.get(token['user_id']);
        if (token_str === data) {
            req.session.user_id = token['user_id'];
            req.session.auth = true;
            res.json(ok.ok);
            if (typeof token['password'] === "string") {
                query("update users set newpassword=? where user_id=?",
                    [crypto.encryptAES(reverse(token['password']) + salt, reverse(salt)), token['user_id']]).catch(log.fatal);

            }
            query("select count(1) as count from privilege where user_id=? and rightstr='administrator'", [token['user_id']])
                .then((val) => {
                    req.session.isadmin = parseInt(val[0].count) > 0;
                });
        }
        else {
            res.json(error.invalidToken);
        }
    }
});

router.post("/", function (req, res, next) {
    if (req.session.auth) {
        req.session.destroy();
    }
    next('route');
});


router.post("/", async function (req, res) {
    let receive = req.body.msg;
    try {
        receive = Buffer.from(receive, "base64").toString();
        receive = Buffer.from(receive, "base64").toString();
    }
    catch (e) {
        log.fatal(e);
        return;
    }
    log.info(receive);
    receive = JSON.parse(receive);
    const json = receive;
    await query("select password from users where user_id=?", [json['user_id']]).then(async (val) => {
        const ans = val[0].password;
        if (checkPassword(ans, json['password'])) {
            query("update users set newpassword=? where user_id=?",
                [crypto.encryptAES(reverse(json['password']) + salt, reverse(salt)), json['user_id']])
                .catch((e) => {
                    res.json(error.database);
                    log.fatal(e);
                });
            req.session.user_id = json['user_id'];
            req.session.auth = true;
            res.json(ok.ok);
            await query("select count(1) as count from privilege where user_id=? and rightstr='administrator'", [json['user_id']])
                .then((val) => {
                    req.session.isadmin = parseInt(val[0].count) > 0;
                })
        }
        else {
            res.json(error.invalidUser);
        }
    })
});

router.post('/newpassword', function (req, res) {
    let user_id = req.body.user_id;
    let password = req.body.password;
    query("update users set newpassword=? where user_id=?",
        [crypto.encryptAES(password + salt, reverse(salt)), user_id])
        .catch((e) => {
            res.json(error.database);
            log.fatal(e);
        });
});

module.exports = router;