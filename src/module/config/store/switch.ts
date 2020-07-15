import {mysqlInstance} from "./switch/mysql";
import {redisInstance} from "./switch/redis";

export const mysql = mysqlInstance;

export const redis = redisInstance;
