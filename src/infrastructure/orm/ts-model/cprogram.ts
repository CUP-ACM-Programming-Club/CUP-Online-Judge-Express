import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "cprogram", timestamps: false })
export class cprogram extends Model<cprogram> {
    @Column({ type: DataType.STRING(10) })
    name!: string;
    @Column({ field: "user_id", type: DataType.STRING(30) })
    userId!: string;
    @Column({ type: DataType.TINYINT })
    sex!: number;
    @Column({ type: DataType.STRING(32) })
    scholar!: string;
    @Column({ type: DataType.STRING(32) })
    subject!: string;
    @Column({ type: DataType.STRING(32) })
    teacher!: string;
    @Column({ type: DataType.STRING(16) })
    class!: string;
    @Column({ type: DataType.STRING(24) })
    bornday!: string;
    @Column({ field: "mobile_phone", type: DataType.STRING(15) })
    mobilePhone!: string;
    @Column({ type: DataType.STRING(15) })
    qq!: string;
    @Column({ type: DataType.STRING(48) })
    wechat!: string;
    @Column({ type: DataType.STRING(48) })
    email!: string;
    @Column({ type: DataType.TINYINT })
    group!: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    room?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    seat?: number;
    @Column({ allowNull: true, type: DataType.TINYINT })
    pass?: number;
}