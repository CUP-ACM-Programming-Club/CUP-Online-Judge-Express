const app = require('../app');
const debug = require('debug')('express:server');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const query = require('../module/mysql_query');
const config = require('../config.json');
server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

let onlineUser = [];

function findpos(username) {
    const len = onlineUser.length;
    for (let i = 0; i < len; ++i) {
        if (onlineUser[i]['user_id'] === username) {
            return i;
        }
    }
    return -1;
}

function findurl(pos,url){
    const len=onlineUser[pos].url.length;
    for(let i=0;i<len;++i)
    {
        if(onlineUser[pos].url[i]===url)
        {
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
            if (rows[0]['authcode'] === data['authcode']) {
                const pos=findpos(data['user_id']);
                console.log(data['user_id']);
                if(pos!==-1)
                {
                    const upos=findpos(data['url']);
                    if(upos!==-1)
                        onlineUser[pos]['url'].push(data['url']);
                }
                else {
                    const user = {
                        user_id: data['user_id'],
                        url: [data['url']],
                        identify: data['id']
                    };
                    onlineUser.push(user);
                }
                username = data['user_id'];
                url=data['url'];
                //console.log("save"+url);
                query("UPDATE users SET authcode=? WHERE user_id=?", ["NULL", data['user_id']]);
                let userArr = {
                    user_cnt: onlineUser.length,
                    user: onlineUser
                };
                //console.log(userArr);
                socket.emit("user", userArr);
                socket.broadcast.emit("user", userArr);
            }
        })
    });

    socket.on("submit", function (data) {
        socket.broadcast.emit("submit", data);
    });

    socket.on("disconnect", function () {
        let pos = findpos(username);
        if (pos !== -1) {
            let upos=findurl(pos,url);
            onlineUser[pos].url.splice(upos,1);
            if(onlineUser[pos].url.length===0)
                onlineUser.splice(pos, 1);
        }
    })
});
