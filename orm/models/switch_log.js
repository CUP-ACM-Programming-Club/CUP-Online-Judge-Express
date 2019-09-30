/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("switchLog", {
		id: {
			type: DataTypes.BIGINT,
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
			field: "id"
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
			type: DataTypes.INTEGER(11),
			allowNull: false,
			field: "value"
		},
		comment: {
			type: DataTypes.STRING(1024),
			allowNull: false,
			field: "comment"
		}
	}, {
		tableName: "switch_log"
	});
};
