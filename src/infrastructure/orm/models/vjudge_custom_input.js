/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_custom_input", {
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		input_text: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: "vjudge_custom_input"
	});
};
