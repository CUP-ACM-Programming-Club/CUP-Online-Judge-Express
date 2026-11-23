import {ModelCtor, Model} from "sequelize-typescript";
import {PersistenceStore} from "./store";
import dayjs from "dayjs";

export default function <T extends Model>(Model: ModelCtor<T>) {
    const MySQLStore = function () {
    } as any as { new(): PersistenceStore<T> }


    MySQLStore.prototype.set = function (payload: any) {
        return Model.upsert(Object.assign(payload, {modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss")}));
    };

    MySQLStore.prototype.get = function (key: string) {
        // sequelize v6 的类型无法从泛型 T 推出 key 属性，运行时行为不变
        return Model.findOne({where: {key} as any});
    };

    MySQLStore.prototype.remove = function (key: string) {
        return Model.destroy({
            where: {key} as any
        });
    };

    MySQLStore.prototype.getAll = function () {
        return Model.findAll();
    };

    return MySQLStore;
};
