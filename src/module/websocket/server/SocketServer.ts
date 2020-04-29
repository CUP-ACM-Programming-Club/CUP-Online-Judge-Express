import socket from "socket.io";
import {server} from "../../init/http-server";
const io = socket(server);
export default io;
