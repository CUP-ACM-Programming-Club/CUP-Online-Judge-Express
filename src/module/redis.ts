import bluebird from "bluebird";
import * as redis from "redis";
import {Worker} from "cluster";
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

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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
}

module.exports = redisClient;
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
