const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient();
module.exports = client;
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
