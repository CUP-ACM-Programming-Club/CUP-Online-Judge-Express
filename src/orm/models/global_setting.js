/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("global_setting", {
		label: {
			type: DataTypes.STRING(24),
			allowNull: false
		},
		value: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		tableName: "global_setting"
	});
};
