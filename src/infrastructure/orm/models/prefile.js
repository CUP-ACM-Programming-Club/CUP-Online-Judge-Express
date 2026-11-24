/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("prefile", {
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		prepend: {
			type: DataTypes.INTEGER(4),
			allowNull: false
		},
		code: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		type: {
			type: DataTypes.STRING(4),
			allowNull: false
		}
	}, {
		tableName: "prefile"
	});
};
