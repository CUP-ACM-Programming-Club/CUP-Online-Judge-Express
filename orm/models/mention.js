/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("mention", {
		user_id: {
			type: DataTypes.STRING(40),
			allowNull: false
		},
		article_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		comment_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		viewed: {
			type: DataTypes.INTEGER(1),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "mention"
	});
};
