/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("label_list", {
		label_name: {
			type: DataTypes.STRING(20),
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
		tableName: "label_list"
	});
};
