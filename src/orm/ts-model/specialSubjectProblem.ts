import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "special_subject_problem", timestamps: false })
export class specialSubjectProblem extends Model<specialSubjectProblem> {
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ field: "topic_id", allowNull: true, type: DataType.INTEGER })
    topicId?: number;
    @Column({ allowNull: true, type: DataType.CHAR(200) })
    title?: string;
    @Column({ field: "oj_name", allowNull: true, type: DataType.CHAR(20) })
    ojName?: string;
    @Column({ type: DataType.INTEGER })
    num!: number;
}