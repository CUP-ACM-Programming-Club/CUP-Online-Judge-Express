/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_accept_language", {
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		accept_language: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		source: {
			type: DataTypes.STRING(12),
			allowNull: false
		}
	}, {
		tableName: "vjudge_accept_language"
	});
};
