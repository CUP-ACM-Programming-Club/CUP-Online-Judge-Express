/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("contest", {
		contest_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		start_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		end_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false,
			defaultValue: "N"
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		private: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		vjudge: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		cmod_visible: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		homework: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		langmask: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		password: {
			type: DataTypes.CHAR(16),
			allowNull: false,
			defaultValue: ""
		},
		ip_policy: {
			type: DataTypes.CHAR(40),
			allowNull: true
		},
		limit_hostname: {
			type: DataTypes.STRING(40),
			allowNull: true
		}
	}, {
		tableName: "contest",
		timestamps: false
	});
};
