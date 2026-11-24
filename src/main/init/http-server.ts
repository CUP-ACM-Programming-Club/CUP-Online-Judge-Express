import http from "http";
import app from "../../app";
export { default as app } from "../../app";
export const server = http.createServer(app);
