const app = require('../app');
const debug = require('debug')('express:server');
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const query = require('../module/mysql_query');
const memcache = require('../module/memcached');
const cookie = require('cookie');
server.listen(port, function () {
    logger.info('Server listening at port %d', port);
});
let onlineUser = {};
let user_socket = {};
let admin_user = {};
let normal_user = {};

function findurl(user, url) {
    const len = user.url.length;
    for (let i = 0; i < len; ++i) {
        if (user.url[i] === url) {
            return i;
        }
    }
    return -1;
}

function broadcast(userArr, type, val) {
    for (let i in userArr) {
        userArr[i].emit(type, val);
        // console.log(userArr[i]);
    }
}

io.on('connection', function (socket) {
    let username;
    let user_nick;
    let url;
    let privilege = null;
    socket.on('auth', async function (data) {
        const parse_cookie = cookie.parse(socket.handshake.headers.cookie);
        const token = parse_cookie['token'] || "";
        const user_id = parse_cookie['user_id'];
        const val = await memcache.get(user_id);
        const cache_token = await memcache.get(user_id + "token");
        if (data['authcode'] === val || token === cache_token) {
            const priv = await query("SELECT count(1) as cnt FROM privilege WHERE rightstr='administrator' and " +
                "user_id=?", [user_id]);
            privilege = parseInt(priv[0].cnt) > 0;
            const nick = await query("SELECT nick FROM users WHERE user_id=?", [user_id]);
            user_nick = nick[0].nick;
            const pos = onlineUser[user_id];
            if (pos !== undefined) {
                pos.url.push(data['url']);
            }
            else {
                const user = {
                    user_id: user_id,
                    url: [data['url']],
                    identify: data['id'],
                    intranet_ip: data['intranet_ip'],
                    ip: data['ip'],
                    version: data['version'],
                    platform: data['platform'],
                    browser_core: data['browser_core'],
                    useragent: data['useragent'],
                    screen: data['screen']
                };
                user_socket[user.user_id] = socket;
                onlineUser[user_id] = user;
                if (privilege) {
                    admin_user[user_id] = socket;
                }
                else {
                    normal_user[user_id] = socket;
                }
            }
            socket.user = user_id;
            username = user_id;
            url = data['url'];
            let online = Object.values(onlineUser);
            let userArr = {
                user_cnt: online.length
            };
            broadcast(normal_user, "user", userArr);
            if (!privilege) {
                socket.emit("user", userArr);
            }
            userArr["user"] = online;
            broadcast(admin_user, "user", userArr);
            if (privilege) {
                socket.emit("user", userArr);
            }
        }
    });

    socket.on("submit", async function (data) {
        //socket.broadcast.emit("submit", data);
        data["user_id"] = username;
        data["nick"] = user_nick;
        if (typeof data["val"]["cid"] !== "undefined") {
            const id_val = await query("SELECT problem_id FROM contest_problem WHERE contest_id=? and num=?", [data["val"]["cid"], data["val"]["pid"]]);
            data["val"]["id"] = id_val[0].problem_id;
        }
        broadcast(admin_user, "submit", data);
    });

    socket.on("msg", function (data) {
        socket.broadcast.emit("msg", data);
        socket.emit("msg", data);
    });

    socket.on("chat", function (data) {
        const toPersonUser_id = data['to'];
        user_socket[toPersonUser_id].emit("chat", {
            from: data['from'],
            content: data['content'],
            time: Date.now().toString()
        });
    });

    socket.on("disconnect", function () {
        let pos = onlineUser[username];
        if (pos !== undefined) {
            let upos = findurl(pos, url);
            pos.url.splice(upos, 1);
            if (pos.url.length === 0) {
                delete user_socket[username];
                delete onlineUser[username];
                if (admin_user[username])
                    delete admin_user[username];
                if (normal_user[username])
                    delete normal_user[username];
            }
            let online = Object.values(onlineUser);
            let userArr = {
                user_cnt: online.length,
                user: online
            };
            socket.emit("user", userArr);
            socket.broadcast.emit("user", userArr);
        }
    });
})
;
