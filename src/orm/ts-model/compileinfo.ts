import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "compileinfo", timestamps: false })
export class compileinfo extends Model<compileinfo> {
    @Column({ field: "solution_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    solutionId!: number;
    @Column({ allowNull: true, type: DataType.STRING })
    error?: string;
}