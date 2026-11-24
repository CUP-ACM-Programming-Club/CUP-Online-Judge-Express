/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define("online_num_log", {
		logtime: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
			field: "logtime"
		},
		number: {
			type: DataTypes.INTEGER(10),
			allowNull: false,
			field: "number"
		}
	}, {
		tableName: "online_num_log"
	});
};
