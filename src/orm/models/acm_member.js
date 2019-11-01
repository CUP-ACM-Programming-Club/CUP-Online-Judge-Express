/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("acm_member", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false
		},
		level: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "acm_member"
	});
};
