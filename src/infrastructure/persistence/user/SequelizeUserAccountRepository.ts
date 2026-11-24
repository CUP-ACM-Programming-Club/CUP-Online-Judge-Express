import { UserAccountRepository } from "../../../application/ports/UserAccountRepository";
const sequelize = require("../../orm/instance/sequelize");
// sequelize v6 移除了 sequelize.import()；它对 (name, defineFn) 的调用等价于 defineFn(sequelize, DataTypes)
const { DataTypes } = require("sequelize");
const User = require("../../orm/models/users")(sequelize, DataTypes);

User.sync();

export class SequelizeUserAccountRepository implements UserAccountRepository {
	findByUserId(user_id: string) {
		return User.findOne({ where: { user_id } });
	}

	create(row: any) {
		return User.create(row);
	}
}
