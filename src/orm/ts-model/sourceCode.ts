import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "source_code", timestamps: false })
export class sourceCode extends Model<sourceCode> {
    @Column({ field: "solution_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    solutionId!: number;
    @Column({ type: DataType.STRING })
    source!: string;
}