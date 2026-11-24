/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("users", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: "",
			primaryKey: true
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		submit: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		solved: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		vjudge_submit: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		vjudge_accept: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		vjudge_solved: {
			type: DataTypes.INTEGER(11),
			allowNull: true,
			defaultValue: "0"
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false,
			defaultValue: "N"
		},
		ip: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: ""
		},
		accesstime: {
			type: DataTypes.DATE,
			allowNull: true
		},
		volume: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "1"
		},
		language: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "1"
		},
		password: {
			type: DataTypes.STRING(32),
			allowNull: true
		},
		newpassword: {
			type: DataTypes.STRING(64),
			allowNull: true
		},
		authcode: {
			type: DataTypes.STRING(32),
			allowNull: true
		},
		reg_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		nick: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		school: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		confirmquestion: {
			type: DataTypes.CHAR(100),
			allowNull: true
		},
		confirmanswer: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		avatar: {
			type: DataTypes.INTEGER(1),
			allowNull: true,
			defaultValue: "0"
		},
		money: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			defaultValue: "0"
		},
		blog: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		github: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		biography: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		avatarUrl: {
			type: DataTypes.STRING(100),
			allowNull: true
		}
	}, {
		tableName: "users"
	});
};
