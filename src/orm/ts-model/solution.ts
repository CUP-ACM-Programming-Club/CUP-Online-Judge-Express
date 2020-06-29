import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "solution", timestamps: false })
export class solution extends Model<solution> {
    @Column({ field: "solution_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "solution_result_solution_id_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_solution_id_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_solution_id_problem_id_index", using: "BTREE", order: "ASC", unique: false })
    solutionId?: number;
    @Column({ field: "problem_id", type: DataType.INTEGER })
    @Index({ name: "pid", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_solution_id_problem_id_index", using: "BTREE", order: "ASC", unique: false })
    problemId!: number;
    @Column({ field: "user_id", type: DataType.CHAR(48) })
    @Index({ name: "uid", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ type: DataType.INTEGER })
    @Index({ name: "solution_time_index", using: "BTREE", order: "ASC", unique: false })
    time!: number;
    @Column({ type: DataType.INTEGER })
    @Index({ name: "solution_memory_index", using: "BTREE", order: "ASC", unique: false })
    memory!: number;
    @Column({ field: "in_date", type: DataType.DATE })
    @Index({ name: "solution_in_date_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_in_date_result_index", using: "BTREE", order: "ASC", unique: false })
    inDate!: Date;
    @Column({ type: DataType.SMALLINT })
    @Index({ name: "res", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_in_date_result_index", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "solution_result_solution_id_index", using: "BTREE", order: "ASC", unique: false })
    result!: number;
    @Column({ type: DataType.INTEGER })
    language!: number;
    @Column({ type: DataType.CHAR(100) })
    ip!: string;
    @Column({ field: "contest_id", allowNull: true, type: DataType.INTEGER })
    @Index({ name: "cid", using: "BTREE", order: "ASC", unique: false })
    contestId?: number;
    @Column({ field: "topic_id", allowNull: true, type: DataType.INTEGER })
    topicId?: number;
    @Column({ type: DataType.TINYINT })
    valid!: number;
    @Column({ field: "pass_point", allowNull: true, type: DataType.TINYINT })
    passPoint?: number;
    @Column({ type: DataType.TINYINT })
    num!: number;
    @Column({ field: "code_length", type: DataType.INTEGER })
    codeLength!: number;
    @Column({ allowNull: true, type: DataType.DATE })
    judgetime?: Date;
    @Column({ field: "pass_rate", type: DataType.DECIMAL(3,2) })
    passRate!: string;
    @Column({ type: DataType.CHAR(16) })
    judger!: string;
    @Column({ allowNull: true, type: DataType.TINYINT })
    share?: number;
    @Column({ allowNull: true, type: DataType.STRING(40) })
    fingerprint?: string;
    @Column({ allowNull: true, type: DataType.STRING(40) })
    fingerprintRaw?: string;
}