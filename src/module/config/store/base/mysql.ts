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
        return Model.findOne({where: {key}});
    };

    MySQLStore.prototype.remove = function (key: string) {
        return Model.destroy({
            where: {key}
        });
    };

    MySQLStore.prototype.getAll = function () {
        return Model.findAll();
    };

    return MySQLStore;
};
