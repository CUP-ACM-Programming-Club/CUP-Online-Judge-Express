import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "prefile", timestamps: false })
export class prefile extends Model<prefile> {
    @Column({ field: "problem_id", type: DataType.INTEGER })
    problemId!: number;
    @Column({ type: DataType.TINYINT })
    prepend!: number;
    @Column({ type: DataType.STRING })
    code!: string;
    @Column({ type: DataType.STRING(4) })
    type!: string;
}