const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

if (global.unit_test === "autotest") {
	module.exports = {
		lrangeAsync: function () {
			return ["test"];
		},
		rpushAsync: function () {
			return ["test"];
		},
		quit: function () {
		}
	};
} else {
	module.exports = redis.createClient();
}
/*
exports.lrange=(key,start,end)=>{
    return new Promise((resolve,reject)=>{
        client.lrange(key,start,end,(err,reply)=>{
            if(err){
                reject(err);
            }
            else{
                resolve(reply);
            }
        })
    })
};

exports.lPush=(key,value)=>{
    return new Promise((resolve,reject)=>{
        client.lPush(key,value,function(err,reply){
            if(err){
                reject(err);
            }
            else{
                resolve(reply);
            }
        })
    })
};
*/
