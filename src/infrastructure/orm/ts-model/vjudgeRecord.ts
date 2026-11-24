import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_record", timestamps: false })
export class vjudgeRecord extends Model<vjudgeRecord> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "vjudge_record_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ field: "oj_name", type: DataType.STRING(30) })
    ojName!: string;
    @Column({ field: "problem_id", type: DataType.STRING(20) })
    problemId!: string;
    @Column({ type: DataType.DATE })
    time!: Date;
    @Column({ type: DataType.INTEGER })
    result!: number;
    @Column({ field: "time_running", type: DataType.INTEGER })
    timeRunning!: number;
    @Column({ type: DataType.INTEGER })
    memory!: number;
    @Column({ field: "code_length", type: DataType.INTEGER })
    codeLength!: number;
    @Column({ type: DataType.STRING(25) })
    language!: string;
}