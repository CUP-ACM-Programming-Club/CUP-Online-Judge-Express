const express = require('express');
const session = require('express-session');
const compression = require("compression");
const FileStore = require('session-file-store')(session);
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const Random = require('meteor-random');
const bodyParser = require('body-parser');
const app = express();
const index = require('./routes/index');
const problem = require('./routes/problem');
const user = require('./routes/user');
const local = require('./routes/local');
const test = require('./routes/test');
const status = require('./routes/status');
const login = require('./routes/login');
const logout = require('./routes/logout');
const faq = require('./routes/faq');
const auth = require('./middleware/auth');
const helmet = require("helmet");
const log4js = require("./module/logger");
const log = log4js.logger('cheese', 'info');
app.use(log4js.connectLogger(log, {level: 'info'}));

const oneDay = 86400000;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view cache', true);
app.use('/static', express.static(__dirname + "/static", {
    maxAge: oneDay * 30
}));
app.use(session({
    store: new FileStore(),
    saveUninitialized: false,
    ttl: oneDay * 31 * 12 * 100,
    resave: false,
    secret: Random.secret(128),
    cookie: {
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000
    }
}));
app.use(compression());
const expiryDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
app.use(session({
        name: 'session',
        keys: ['maybeyoucannotguess', 'whatthiskeyitis'],
        cookie: {
            httpOnly: true,
            expires: expiryDate
        }
    })
);
app.use(logger('dev'));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: false}));
app.use(cookieParser());
app.use('/', index);
app.use('/problem', auth, problem);
app.use('/user', auth, user);
app.use('/test', test);
app.use('/login', login);
app.use('/logout', auth, logout);
app.use('/status', auth, status);
app.use('/faq', auth, faq);
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    log.fatal(err);
    let obj = {
        status: "ERROR",
        statement: "resource not found"
    };
    res.json(obj);
});

module.exports = app;