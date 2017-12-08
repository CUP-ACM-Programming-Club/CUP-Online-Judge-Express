const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const checkPassword = require("../module/check_password");
const log4js = require("../module/logger");
const log = log4js.logger('cheese', 'info');
const crypto = require('../module/encrypt');
const salt = "thisissalt";

const reverse = (val) => {
    return val.toString().split("").reverse().join("");
};

router.post("/", async function (req, res, next) {
    let receive = req.body.msg;
    receive = Buffer.from(receive, "base64").toString();
    receive = Buffer.from(receive, "base64").toString();
    log.info(receive);
    receive = JSON.parse(receive);
    const json = receive;
    await query("select password from users where user_id=?", [json['user_id']]).then(async (val) => {
        const ans = val[0].password;
        if (checkPassword(ans, json['password'])) {
            //   query("update users set newpassword=? where user_id=?",
            //     [crypto.encryptAES(reverse(json['password']) + salt, reverse(salt)), json['user_id']]).catch(logger.fatal);
            req.session.user_id = json['user_id'];
            req.session.auth = true;
            res.json({
                status: "OK",
            });
            await query("select count(1) as count from privilege where user_id=? and rightstr='administrator'", [json['user_id']])
                .then((val) => {
                    req.session.isadmin = parseInt(val[0].count) > 0;
                })
        }
        else {
            res.json({
                status: "error",
                statement: "user invalid"
            });
        }
    })
});

module.exports = router;