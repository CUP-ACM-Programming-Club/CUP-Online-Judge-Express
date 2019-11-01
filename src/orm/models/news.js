/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("news", {
		news_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		user_id: {
			type: DataTypes.STRING(48),
			allowNull: false,
			defaultValue: ""
		},
		title: {
			type: DataTypes.STRING(200),
			allowNull: false,
			defaultValue: ""
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		time: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: "2016-05-13 19:24:00"
		},
		importance: {
			type: DataTypes.INTEGER(4),
			allowNull: false,
			defaultValue: "0"
		},
		defunct: {
			type: DataTypes.CHAR(1),
			allowNull: false,
			defaultValue: "N"
		}
	}, {
		tableName: "news"
	});
};
