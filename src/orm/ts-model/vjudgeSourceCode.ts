import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_source_code", timestamps: false })
export class vjudgeSourceCode extends Model<vjudgeSourceCode> {
    @Column({ field: "solution_id", type: DataType.INTEGER })
    solutionId!: number;
    @Column({ type: DataType.STRING })
    source!: string;
}