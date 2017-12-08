const app = require('../app');
//const local_app = require('../local');
const debug = require('debug')('express:server');
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const query = require('../module/mysql_query');
//const config = require('../config.json');
const cachePool = require('../module/cachePool');
server.listen(port, function () {
    logger.info('Server listening at port %d', port);
});
/*
local_app.listen(4323);
*/
let onlineUser = {};
let user_socket = {};

function findurl(user, url) {
    const len = user.url.length;
    for (let i = 0; i < len; ++i) {
        if (user.url[i] === url) {
            return i;
        }
    }
    return -1;
}

io.on('connection', function (socket) {
    let username;
    let url;
    socket.on('auth', function (data) {
        //console.log(data);
        query("SELECT authcode FROM users WHERE user_id=?", [data['user_id']], function (rows) {
            if (rows[0]['authcode'] !== "NULL" && rows[0]['authcode'] === data['authcode']) {
                const usr_auth = {
                    user_id: data['user_id'],
                    auth: data['authcode']
                };
                cachePool.set(data['ip'], JSON.stringify(usr_auth), 60 * 60);
                const pos = onlineUser[data['user_id']];
                if (pos !== undefined) {
                    pos.url.push(data['url']);
                }
                else {
                    const user = {
                        user_id: data['user_id'],
                        url: [data['url']],
                        identify: data['id'],
                        ip: data['ip'],
                        version: data['version'],
                        platform: data['platform'],
                        browser_core: data['browser_core'],
                        useragent: data['useragent'],
                        screen: data['screen']
                    };
                    user_socket[user.user_id] = socket;
                    onlineUser[data['user_id']] = user;
                }
                socket.user = data['user_id'];
                username = data['user_id'];
                url = data['url'];
                query("UPDATE users SET authcode=? WHERE user_id=?", ["NULL", data['user_id']]);
                let online = Object.values(onlineUser);
                let userArr = {
                    user_cnt: online.length,
                    user: online
                };
                socket.emit("user", userArr);
                socket.broadcast.emit("user", userArr);
            }
        })
    });

    socket.on("submit", function (data) {
        socket.broadcast.emit("submit", data);
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
                cachePool.del(pos.ip);
                delete onlineUser[username];
            }
        }
    });
});
