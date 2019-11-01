const app = require("../../app");
module.exports = {app, server:require("http").createServer(app)};
