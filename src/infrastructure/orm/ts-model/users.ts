import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "users", timestamps: false })
export class users extends Model<users> {
    @Column({ field: "user_id", primaryKey: true, type: DataType.STRING(48) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    userId!: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    email?: string;
    @Column({ allowNull: true, type: DataType.INTEGER })
    @Index({ name: "users_solved_submit_reg_time_index", using: "BTREE", order: "ASC", unique: false })
    submit?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    @Index({ name: "users_solved_submit_reg_time_index", using: "BTREE", order: "DESC", unique: false })
    solved?: number;
    @Column({ field: "vjudge_submit", allowNull: true, type: DataType.INTEGER })
    vjudgeSubmit?: number;
    @Column({ field: "vjudge_accept", allowNull: true, type: DataType.INTEGER })
    vjudgeAccept?: number;
    @Column({ field: "vjudge_solved", allowNull: true, type: DataType.INTEGER })
    vjudgeSolved?: number;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
    @Column({ type: DataType.STRING(20) })
    ip!: string;
    @Column({ allowNull: true, type: DataType.DATE })
    accesstime?: Date;
    @Column({ type: DataType.INTEGER })
    volume!: number;
    @Column({ type: DataType.INTEGER })
    language!: number;
    @Column({ allowNull: true, type: DataType.STRING(32) })
    password?: string;
    @Column({ allowNull: true, type: DataType.STRING(128) })
    newpassword?: string;
    @Column({ allowNull: true, type: DataType.STRING(32) })
    authcode?: string;
    @Column({ field: "reg_time", allowNull: true, type: DataType.DATE })
    @Index({ name: "users_solved_submit_reg_time_index", using: "BTREE", order: "ASC", unique: false })
    regTime?: Date;
    @Column({ type: DataType.STRING(100) })
    nick!: string;
    @Column({ type: DataType.STRING(100) })
    school!: string;
    @Column({ allowNull: true, type: DataType.CHAR(100) })
    confirmquestion?: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    confirmanswer?: string;
    @Column({ allowNull: true, type: DataType.TINYINT })
    avatar?: number;
    @Column({ type: DataType.INTEGER })
    money!: number;
    @Column({ allowNull: true, type: DataType.STRING })
    blog?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    github?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    biography?: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    avatarUrl?: string;
}