import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_problem", timestamps: false })
export class vjudgeProblem extends Model<vjudgeProblem> {
    @Column({ field: "problem_id", type: DataType.INTEGER })
    @Index({ name: "vjudge_problem_problem", using: "BTREE", order: "ASC", unique: false })
    problemId!: number;
    @Column({ field: "vjudge_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    vjudgeId?: number;
    @Column({ type: DataType.STRING(100) })
    @Index({ name: "title", using: "BTREE", order: "ASC", unique: false })
    title!: string;
    @Column({ allowNull: true, type: DataType.STRING(100) })
    label?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    description?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    input?: string;
    @Column({ allowNull: true, type: DataType.STRING })
    output?: string;
    @Column({ field: "sample_input", allowNull: true, type: DataType.STRING })
    sampleInput?: string;
    @Column({ field: "sample_output", allowNull: true, type: DataType.STRING })
    sampleOutput?: string;
    @Column({ allowNull: true, type: DataType.INTEGER })
    accepted?: number;
    @Column({ allowNull: true, type: DataType.INTEGER })
    submit?: number;
    @Column({ field: "time_limit", type: DataType.INTEGER })
    timeLimit!: number;
    @Column({ field: "memory_limit", allowNull: true, type: DataType.INTEGER })
    memoryLimit?: number;
    @Column({ type: DataType.STRING(10) })
    @Index({ name: "vjudge_problem_problem", using: "BTREE", order: "ASC", unique: false })
    @Index({ name: "vjudge_problem_problemset", using: "BTREE", order: "ASC", unique: false })
    source!: string;
    @Column({ allowNull: true, type: DataType.TINYINT })
    spj?: number;
    @Column({ allowNull: true, type: DataType.STRING(3) })
    defunct?: string;
    @Column({ field: "in_date", allowNull: true, type: DataType.DATE })
    inDate?: Date;
}