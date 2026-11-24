import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_solution", timestamps: false })
export class vjudgeSolution extends Model<vjudgeSolution> {
    @Column({ field: "runner_id", allowNull: true, type: DataType.STRING })
    runnerId?: string;
    @Column({ field: "solution_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "sid", using: "BTREE", order: "ASC", unique: false })
    solutionId?: number;
    @Column({ field: "problem_id", type: DataType.INTEGER })
    @Index({ name: "pid", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "problemfrom", using: "BTREE", order: "ASC", unique: false })
    problemId!: number;
    @Column({ field: "user_id", type: DataType.CHAR(48) })
    @Index({ name: "uid", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ type: DataType.INTEGER })
    @Index({ name: "vjudge_solution_time_index", using: "BTREE", order: "ASC", unique: false })
    time!: number;
    @Column({ type: DataType.INTEGER })
    memory!: number;
    @Column({ field: "in_date", type: DataType.DATE })
    inDate!: Date;
    @Column({ type: DataType.SMALLINT })
    result!: number;
    @Column({ type: DataType.INTEGER })
    language!: number;
    @Column({ type: DataType.CHAR(42) })
    ip!: string;
    @Column({ field: "contest_id", allowNull: true, type: DataType.INTEGER })
    @Index({ name: "cid", using: "BTREE", order: "ASC", unique: false })
    contestId?: number;
    @Column({ type: DataType.TINYINT })
    num!: number;
    @Column({ field: "code_length", type: DataType.INTEGER })
    codeLength!: number;
    @Column({ field: "oj_name", type: DataType.STRING(24) })
    @Index({ name: "problemfrom", using: "BTREE", order: "ASC", unique: false })
    ojName!: string;
    @Column({ type: DataType.STRING(24) })
    judger!: string;
    @Column({ allowNull: true, type: DataType.TINYINT })
    ustatus?: number;
    @Column({ allowNull: true, type: DataType.TINYINT })
    share?: number;
}