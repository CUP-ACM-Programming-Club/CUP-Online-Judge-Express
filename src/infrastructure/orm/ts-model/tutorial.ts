import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "tutorial", timestamps: false })
export class tutorial extends Model<tutorial> {
    @Column({ field: "tutorial_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    tutorialId?: number;
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ type: DataType.STRING })
    content!: string;
    @Column({ field: "in_date", type: DataType.DATE })
    inDate!: Date;
    @Column({ field: "user_id", type: DataType.STRING(30) })
    userId!: string;
    @Column({ field: "solution_id", type: DataType.INTEGER })
    solutionId!: number;
    @Column({ type: DataType.STRING(10) })
    source!: string;
    @Column({ type: DataType.INTEGER })
    like!: number;
    @Column({ type: DataType.INTEGER })
    dislike!: number;
}