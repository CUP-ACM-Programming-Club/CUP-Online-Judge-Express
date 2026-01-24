import Memcached from "memcached";

const memcached = new Memcached("127.0.0.1:11211");

const memcache_obj = {
	get(val: string): Promise<any> {
		return new Promise(function (resolve, reject) {
			memcached.get(val, function (err: any, data: any) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	},
	instance: memcached
};

export = memcache_obj;