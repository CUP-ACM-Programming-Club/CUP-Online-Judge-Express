import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_custom_input", timestamps: false })
export class vjudgeCustomInput extends Model<vjudgeCustomInput> {
    @Column({ field: "solution_id", type: DataType.INTEGER })
    solutionId!: number;
    @Column({ field: "input_text", allowNull: true, type: DataType.STRING })
    inputText?: string;
}