import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "maintain_info", timestamps: false })
export class maintainInfo extends Model<maintainInfo> {
    @Column({ type: DataType.DATEONLY })
    mtime!: string;
    @Column({ type: DataType.STRING })
    msg!: string;
    @Column({ allowNull: true, type: DataType.STRING(20) })
    version?: string;
    @Column({ field: "vj_version", allowNull: true, type: DataType.STRING(20) })
    vjVersion?: string;
    @Column({ field: "frontend_version", allowNull: true, type: DataType.STRING(20) })
    frontendVersion?: string;
}