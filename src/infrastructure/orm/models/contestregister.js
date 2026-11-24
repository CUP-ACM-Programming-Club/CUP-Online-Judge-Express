/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("contestregister", {
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: "",
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		department: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		major: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		phonenumber: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		school: {
			type: DataTypes.STRING(100),
			allowNull: false,
			defaultValue: ""
		},
		ip: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: ""
		},
		reg_time: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: "contestregister"
	});
};
