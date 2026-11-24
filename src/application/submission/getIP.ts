/**
 * 取请求方 IP（与 interfaces/http/getIP 相同的取法：优先 x-forwarded-for 的第一个地址）。
 * 提交既来自 HTTP 也来自 WebSocket（socket.request），只依赖 headers / connection 两个字段。
 */
export = function getIP(req: { headers: any, connection: any }): string {
	return (<string>(req.headers["x-forwarded-for"] || req.connection.remoteAddress)).split(",")[0];
};
