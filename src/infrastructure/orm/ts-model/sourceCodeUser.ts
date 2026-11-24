import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "source_code_user", timestamps: false })
export class sourceCodeUser extends Model<sourceCodeUser> {
    @Column({ field: "solution_id", primaryKey: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    @Index({ name: "source_code_user_solution_id_index", using: "BTREE", order: "ASC", unique: false })
    solutionId!: number;
    @Column({ type: DataType.STRING })
    source!: string;
    @Column({ allowNull: true, type: DataType.STRING(64) })
    @Index({ name: "source_code_user_hash_index", using: "BTREE", order: "ASC", unique: false })
    hash?: string;
}