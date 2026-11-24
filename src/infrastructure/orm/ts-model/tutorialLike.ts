import { Model, Table, Column, DataType, Index, Sequelize, ForeignKey } from "sequelize-typescript";

@Table({ tableName: "tutorial_like", timestamps: false })
export class tutorialLike extends Model<tutorialLike> {
    @Column({ field: "user_id", type: DataType.STRING(40) })
    userId!: string;
    @Column({ field: "tutorial_id", type: DataType.INTEGER })
    @Index({ name: "tutorial_like_tutorial_tutorial_id_fk", using: "BTREE", order: "ASC", unique: false })
    tutorialId!: number;
    @Column({ type: DataType.INTEGER })
    type!: number;
}