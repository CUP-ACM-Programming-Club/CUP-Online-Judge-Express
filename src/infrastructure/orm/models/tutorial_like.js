/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("tutorial_like", {
		user_id: {
			type: DataTypes.STRING(40),
			allowNull: false
		},
		tutorial_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			references: {
				model: "tutorial",
				key: "tutorial_id"
			}
		},
		type: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "tutorial_like"
	});
};
