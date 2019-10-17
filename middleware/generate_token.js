const client = require("../module/redis");
const HashLength = 16;
const ListSize = 50;
const createHash = require("hash-generator");

async function storeRedis(hash, user_id) {
	await client.rpushAsync(`${user_id}newToken`, hash);
	let size = await client.llenAsync(`${user_id}newToken`);
	size -= ListSize;
	while (size-- > 0) {
		await client.lpopAsync(`${user_id}newToken`);
	}
}

module.exports = function (req, res, next) {
	const hash = createHash(HashLength);
	res.cookie("newToken", hash, {maxAge: 3600 * 1000 * 24, httpOnly: true});
	res.cookie("user_id", req.session.user_id, {maxAge: 3600 * 1000 * 24, httpOnly: true});
	storeRedis(hash, req.session.user_id);
	if (typeof next === "function") {
		return next();
	}
};
