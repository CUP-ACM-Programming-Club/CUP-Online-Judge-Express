class SocketSet {
	constructor () {
		this.__socket__ = {};
	}

	getSocket(id) {
		return this.__socket__[id];
	}

	setSocket(id, payload) {
		this.__socket__[id] = payload;
	}
}

module.exports = SocketSet;
