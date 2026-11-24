/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("vjudge_label_list", {
		label_name: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		label_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		prev_label_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "-1"
		}
	}, {
		tableName: "vjudge_label_list"
	});
};
