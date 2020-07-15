import redisFactory from "../base/redis";
import {config as Config} from "../../../../orm/ts-model";

export const redisInstance = redisFactory<Config>("config");
