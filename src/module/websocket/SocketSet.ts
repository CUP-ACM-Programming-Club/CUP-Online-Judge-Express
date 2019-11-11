interface SocketMap {
	[id: string]: any
}

export class SocketSet {
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

	remove(id: string) {
		if (Object.prototype.hasOwnProperty.call(this.__socket__, id)) {
			delete this.__socket__[id];
		}
	}

	getInnerStorage() {
		return this.__socket__;
	}

	toArray() {
		return Object.values(this.__socket__);
	}
}

module.exports = new SocketSet();
