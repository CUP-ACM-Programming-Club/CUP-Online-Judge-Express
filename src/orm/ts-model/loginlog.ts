import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "loginlog", timestamps: false })
export class loginlog extends Model<loginlog> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "user_log_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ allowNull: true, type: DataType.STRING(40) })
    password?: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    ip?: string;
    @Column({ allowNull: true, type: DataType.DATE })
    @Index({ name: "loginlog_time_index", using: "BTREE", order: "DESC", unique: false })
    @Index({ name: "user_log_index", using: "BTREE", order: "ASC", unique: false })
    time?: Date;
    @Column({ field: "browser_name", allowNull: true, type: DataType.STRING(30) })
    browserName?: string;
    @Column({ field: "browser_version", allowNull: true, type: DataType.STRING(10) })
    browserVersion?: string;
    @Column({ field: "os_name", allowNull: true, type: DataType.STRING(35) })
    osName?: string;
    @Column({ field: "os_version", allowNull: true, type: DataType.STRING(10) })
    osVersion?: string;
}