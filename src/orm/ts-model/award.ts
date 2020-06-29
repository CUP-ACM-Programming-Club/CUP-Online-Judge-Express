import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "award", timestamps: false })
export class award extends Model<award> {
    @Column({ field: "user_id", type: DataType.STRING(48) })
    @Index({ name: "award_user_id_index", using: "BTREE", order: "ASC", unique: false })
    userId!: string;
    @Column({ type: DataType.STRING(48) })
    award!: string;
    @Column({ type: DataType.INTEGER })
    @Index({ name: "award_year_index", using: "BTREE", order: "ASC", unique: false })
    year!: number;
}