const client = require("../../redis");
const ListSize = 50;

class TokenManager {
	constructor () {}

	async removeToken(userId: string) {
		let size = await client.llenAsync(`${userId}newToken`);
		while(size-- > 0) {
			await client.lpopAsync(`${userId}newToken`);
		}
		size = await client.llenAsync(`${userId}token`);
		while(size-- > 0) {
			await client.lpopAsync(`${userId}token`);
		}
	}

	async storeToken (userId: string, hash: string) {
		await client.rpushAsync(`${userId}newToken`, hash);
		let size = await client.llenAsync(`${userId}newToken`);
		size -= ListSize;
		while (size-- > 0) {
			await client.lpopAsync(`${userId}newToken`);
		}
	}
}

export default new TokenManager();
