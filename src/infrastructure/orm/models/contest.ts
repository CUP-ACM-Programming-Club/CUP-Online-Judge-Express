import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
	tableName: "contest",
	timestamps:false
})
export default class Contest extends Model<Contest> {
	@Column({
		primaryKey: true,
		allowNull: false,
		type: DataType.INTEGER
	})
	contest_id!: number

	@Column({
		type: DataType.DATE,
		allowNull: true
	})
	title!: string

	@Column({
		type: DataType.DATE,
		allowNull: true
	})
	start_time!: Date

	@Column({
		type: DataType.DATE,
		allowNull: true
	})
	end_time!: Date

	@Column({
		type: DataType.CHAR,
		defaultValue: "N",
		allowNull: false
	})
	defunct!: string

	@Column({
		type: DataType.TEXT,
		allowNull: true
	})
	description!: string

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		defaultValue: 0
	})
	private!: number;

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		defaultValue: 0
	})
	vjudge!: number

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		defaultValue: 0
	})
	cmod_visible!: number

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		defaultValue: 0
	})
	homework!: number

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		defaultValue: 0
	})
	langmask!: number

	@Column({
		type: DataType.CHAR,
		allowNull: false,
		defaultValue: ""
	})
	password!: string

	@Column({
		type: DataType.CHAR,
		allowNull: true
	})
	ip_policy!: string

	@Column({
		type: DataType.STRING,
		allowNull: true
	})
	limit_hostname!: string

	@Column({
		type: DataType.INTEGER,
		allowNull: false,
		defaultValue: 0
	})
	show_sim!: number
}
