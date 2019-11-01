/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("special_subject", {
		topic_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		private: {
			type: DataTypes.INTEGER(4),
			allowNull: false
		},
		vjudge: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		langmask: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		password: {
			type: DataTypes.CHAR(16),
			allowNull: false
		}
	}, {
		tableName: "special_subject"
	});
};
