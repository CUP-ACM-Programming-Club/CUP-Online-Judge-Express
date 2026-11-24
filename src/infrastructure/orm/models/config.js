/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("config", {
		key: {
			type: DataTypes.STRING(40),
			allowNull: false,
			primaryKey: true,
			field: "key"
		},
		value: {
			type: DataTypes.STRING(4096),
			allowNull: false,
			field: "value"
		},
		comment: {
			type: DataTypes.STRING(128),
			allowNull: true,
			defaultValue: "",
			field: "comment"
		},
		modifyTime: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			field: "modify_time"
		}
	}, {
		tableName: "config"
	});
};
