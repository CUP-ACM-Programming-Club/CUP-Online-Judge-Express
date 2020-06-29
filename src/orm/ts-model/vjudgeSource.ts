import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "vjudge_source", timestamps: false })
export class vjudgeSource extends Model<vjudgeSource> {
    @Column({ field: "source_id", primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
    @Index({ name: "PRIMARY", using: "BTREE", order: "ASC", unique: true })
    sourceId?: number;
    @Column({ type: DataType.STRING(20) })
    @Index({ name: "vjudge_source_name_uindex", using: "BTREE", order: "ASC", unique: true })
    name!: string;
}