interface SocketMap {
	[id: string]: any
}

class SocketSet {
	private readonly __socket__: SocketMap;
	constructor () {
		this.__socket__ = {};
	}

	getSocket(id: string) {
		return this.__socket__[id];
	}

	setSocket(id: string, payload: any) {
		this.__socket__[id] = payload;
	}
}

module.exports = SocketSet;
