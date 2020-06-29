import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contestregister", timestamps: false })
export class contestregister extends Model<contestregister> {
    @Column({ field: "user_id", primaryKey: true, type: DataType.STRING(48) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    userId!: string;
    @Column({ type: DataType.STRING(100) })
    name!: string;
    @Column({ type: DataType.STRING(100) })
    department!: string;
    @Column({ type: DataType.STRING(100) })
    major!: string;
    @Column({ type: DataType.STRING(100) })
    phonenumber!: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    email?: string;
    @Column({ type: DataType.STRING(100) })
    school!: string;
    @Column({ type: DataType.STRING(20) })
    ip!: string;
    @Column({ field: "reg_time", allowNull: true, type: DataType.DATE })
    regTime?: Date;
}