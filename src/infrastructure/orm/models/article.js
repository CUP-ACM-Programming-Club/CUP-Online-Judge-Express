/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("article", {
		user_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		article_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		defunct: {
			type: DataTypes.STRING(2),
			allowNull: false,
			defaultValue: "N"
		},
		create_time: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		},
		edit_time: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		last_post: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
		}
	}, {
		tableName: "article"
	});
};
