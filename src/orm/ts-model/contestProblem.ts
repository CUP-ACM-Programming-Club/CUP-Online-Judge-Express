import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "contest_problem", timestamps: false })
export class contestProblem extends Model<contestProblem> {
    @Column({ field: "id", primaryKey: true, autoIncrement: true })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    id!: number;
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ field: "contest_id", allowNull: true, type: DataType.INTEGER })
    contestId?: number;
    @Column({ type: DataType.CHAR(200) })
    title!: string;
    @Column({ field: "oj_name", allowNull: true, type: DataType.CHAR(10) })
    ojName?: string;
    @Column({ type: DataType.INTEGER })
    num!: number;
}
