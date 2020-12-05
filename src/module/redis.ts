import bluebird from "bluebird";
const redis = require("redis");
import {RedisClient} from "redis";

declare global {
	namespace NodeJS {
		interface Global {
			unit_test: string | undefined
		}
	}
}

const config = global.config;

export interface IRedis extends RedisClient {
	[x: string]: any
}

let redisClient: IRedis;


if (global.unit_test === "autotest") {
	redisClient = {
		lrangeAsync: function () {
			return ["test"];
		},
		rpushAsync: function () {
			return ["test"];
		},
		quit: function () {
		},
		hmset: function () {
			// do nothing
		}
	} as unknown as IRedis;
} else {
	redisClient = redis.createClient(config.redis) as IRedis;
	bluebird.promisifyAll(redisClient);
	bluebird.promisifyAll(redisClient);
}


export default redisClient;
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
