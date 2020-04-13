import socket from "socket.io";
const {server} = require("../../init/http-server");
const io = socket(server);
export default io;
