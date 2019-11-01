/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("tutorial", {
		tutorial_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		problem_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		in_date: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		},
		user_id: {
			type: DataTypes.STRING(30),
			allowNull: false
		},
		solution_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		source: {
			type: DataTypes.STRING(10),
			allowNull: false,
			defaultValue: "local"
		},
		like: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		dislike: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		}
	}, {
		tableName: "tutorial"
	});
};
