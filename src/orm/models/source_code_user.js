/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("source_code_user", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		source: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		hash: {
			type: DataTypes.STRING(64),
			allowNull: true
		}
	}, {
		tableName: "source_code_user"
	});
};
