import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Deal from "./Deal";

@Table
class DealItem extends Model<DealItem> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Deal)
  @Column
  dealId: number;

  @BelongsTo(() => Deal)
  deal: Deal;

  @Column
  name: string;

  @Column
  quantity: number;

  @Column(DataType.DECIMAL(10, 2))
  unitValue: number;

  @Column(DataType.DECIMAL(10, 2))
  total: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default DealItem;