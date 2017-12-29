const Memcached = require("memcached");
const memcached = new Memcached("127.0.0.1:11211");
let memcache_obj = {
	get(val) {
		return new Promise(function (resolve, reject) {
			memcached.get(val, function (err, data) {
				if (err) {
					reject(err);
					//console.log(err);
				}
				else {
					resolve(data);
					//console.log(data);
				}
			});
		});
	}
};
module.exports = memcache_obj;