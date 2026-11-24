import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "custominput", timestamps: false })
export class custominput extends Model<custominput> {
    @Column({ field: "solution_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    solutionId!: number;
    @Column({ field: "input_text", allowNull: true, type: DataType.STRING })
    inputText?: string;
}