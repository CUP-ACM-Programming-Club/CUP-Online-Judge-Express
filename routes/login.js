const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const checkPassword = require("../module/check_password");
const log4js = require("../module/logger");
const log = log4js.logger('cheese', 'info');
const crypto = require('../module/encrypt');
const salt = "thisissalt";
let error = {};
let ok = {};
error.database = {
    status: "error",
    statement: "database error"
};
error.parseJSON = {
    status: "error",
    statement: "invalid JSON string"
};
error.tokenNoMatch = {
    status: "error",
    statement: "token doesn't match"
};
error.passNoMatch = {
    status: "error",
    statement: "password doesn't match"
};
error.invalidToken = {
    status: "error",
    statement: "invalid token"
};

error.invalidUser = {
    status: "error",
    statement: "invalid user"
};

ok.logined = {
    status: "OK",
    statment: "logined"
};
ok.ok = {
    status: "OK"
};

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
router.post("/token", function (req, res) {
    if (req.session.auth) {
        res.json(ok.logined);
    }
    else {
        console.log(req.body.token);
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
        const token_str = token['token'];
        query("SELECT authcode FROM users WHERE user_id=?", [token['user_id']]).then((rows) => {
            const original_token = rows[0].authcode;
            if (token_str === original_token) {
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
        }).catch((e) => {
            res.json(error.database);
            log.fatal(e);
        });
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

module.exports = router;