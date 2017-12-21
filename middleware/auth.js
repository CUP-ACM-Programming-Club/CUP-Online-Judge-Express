const cookie = require('cookie');
const memcache = require('../module/memcached');
const [error, ok] = require('../module/const_var');
module.exports = async (req, res, next) => {
    //const original_token = await memcache.get()
    if (!req.session.auth) {
        const original_cookie = cookie.parse(req.cookie);
        const token = original_cookie['token'];
        const user_id = original_cookie['user_id'];
        if (typeof user_id === "string") {
            const original_token = await memcache.get(user_id + "token");
            if (token === original_token) {
                req.session.user_id = user_id;
                req.session.auth = true;
                res.json(ok.ok);
                query("select count(1) as count from privilege where user_id=? and rightstr='administrator'",
                    [user_id])
                    .then((val) => {
                        req.session.isadmin = parseInt(val[0].count) > 0;
                    });
                return next();
            }
            else {
                return res.json(error.nologin);
            }
        }
        else {
            return res.json(error.nologin);
        }

    }
    else
        return next();
};