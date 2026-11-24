/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("switch", {
		key: {
			type: DataTypes.STRING(128),
			allowNull: false,
			primaryKey: true,
			field: "key"
		},
		value: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0",
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
		tableName: "switch"
	});
};
