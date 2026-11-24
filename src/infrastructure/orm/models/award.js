/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("award", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		award: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		year: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		}
	}, {
		tableName: "award"
	});
};
