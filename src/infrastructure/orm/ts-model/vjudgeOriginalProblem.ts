import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_original_problem", timestamps: false })
export class vjudgeOriginalProblem extends Model<vjudgeOriginalProblem> {
    @Column({ field: "original_problem_id", primaryKey: true, type: DataType.STRING(48) })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    originalProblemId!: string;
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ type: DataType.STRING(10) })
    source!: string;
}