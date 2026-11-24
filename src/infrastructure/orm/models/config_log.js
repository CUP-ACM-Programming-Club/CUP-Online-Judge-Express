/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("configLog", {
		id: {
			type: DataTypes.BIGINT,
			autoIncrement: true,
			primaryKey: true,
			field: "id",
			allowNull: false
		},
		operation: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			field: "operation"
		},
		key: {
			type: DataTypes.STRING(128),
			allowNull: false,
			field: "key"
		},
		value: {
			type: DataTypes.STRING(1024),
			allowNull: false,
			field: "value"
		},
		comment: {
			type: DataTypes.STRING(1024),
			allowNull: true,
			field: "comment"
		}
	}, {
		tableName: "config_log"
	});
};
