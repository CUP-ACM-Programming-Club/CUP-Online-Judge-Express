/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("ban_user", {
		user_id: {
			type: DataTypes.STRING(40),
			allowNull: false,
			primaryKey: true
		},
		bantime: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		}
	}, {
		tableName: "ban_user"
	});
};
