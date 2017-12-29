const session = require('express-session');
const FileStore = require('session-file-store')(session);
const oneDay = 86400000;
const sessionStore = new session.MemoryStore();
const sessionMiddleware = session({
    store: sessionStore,
    saveUninitialized: false,
    ttl: oneDay * 31 * 12 * 100,
    resave: false,
    secret: Random.secret(128),
    cookie: {
        maxAge: 60 * 60 * 1000
    }
});

module.exports.sessionMiddleware = sessionMiddleware;
module.exports.sessionStore = sessionStore;