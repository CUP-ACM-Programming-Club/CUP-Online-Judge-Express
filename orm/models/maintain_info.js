/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("maintain_info", {
		mtime: {
			type: DataTypes.DATEONLY,
			allowNull: false
		},
		msg: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		version: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		vj_version: {
			type: DataTypes.STRING(20),
			allowNull: true
		}
	}, {
		tableName: "maintain_info"
	});
};
