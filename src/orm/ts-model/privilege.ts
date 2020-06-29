import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "privilege", timestamps: false })
export class privilege extends Model<privilege> {
    @Column({ field: "user_id", type: DataType.CHAR(48) })
    userId!: string;
    @Column({ type: DataType.CHAR(30) })
    rightstr!: string;
    @Column({ type: DataType.CHAR(1) })
    defunct!: string;
}