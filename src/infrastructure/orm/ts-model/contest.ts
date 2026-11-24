import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest", timestamps: false })
export class contest extends Model<contest> {
    @Column({ field: "contest_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    contestId?: number;
    @Column({ allowNull: true, type: DataType.STRING(255) })
    title?: string;
    @Column({ field: "start_time", allowNull: true, type: DataType.DATE })
    startTime?: Date;
    @Column({ field: "end_time", allowNull: true, type: DataType.DATE })
    endTime?: Date;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
    @Column({ allowNull: true, type: DataType.STRING })
    description?: string;
    @Column({ type: DataType.TINYINT })
    private!: number;
    @Column({ type: DataType.TINYINT })
    vjudge!: number;
    @Column({ field: "cmod_visible", type: DataType.TINYINT })
    cmodVisible!: number;
    @Column({ type: DataType.TINYINT })
    homework!: number;
    @Column({ type: DataType.BIGINT, comment: "bits for LANG to mask" })
    langmask!: number;
    @Column({ type: DataType.CHAR(16) })
    password!: string;
    @Column({ field: "ip_policy", allowNull: true, type: DataType.CHAR(40) })
    ipPolicy?: string;
    @Column({ field: "limit_hostname", allowNull: true, type: DataType.STRING(40) })
    limitHostname?: string;
    @Column({ allowNull: true, type: DataType.STRING(255) })
    maker?: string;
    @Column({ field: "show_all_ranklist", type: DataType.TINYINT })
    showAllRanklist!: number;
    @Column({ field: "show_sim", type: DataType.TINYINT })
    showSim!: number;
}