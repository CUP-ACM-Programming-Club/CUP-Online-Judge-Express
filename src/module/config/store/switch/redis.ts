import redisFactory from "../base/redis";
import {Switch} from "../../../../orm/ts-model";

export const redisInstance = redisFactory<Switch>("switch");
