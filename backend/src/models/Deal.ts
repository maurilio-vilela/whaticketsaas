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
  HasMany,
  DataType,
  Default
} from "sequelize-typescript";
import Contact from "./Contact";
import Ticket from "./Ticket";
import Company from "./Company";
import User from "./User";
import Tag from "./Tag";
import DealItem from "./DealItem";

@Table
class Deal extends Model<Deal> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default(0.00)
  @Column(DataType.DECIMAL(10, 2))
  totalValue: number;

  @Default(0)
  @Column
  probability: number;

  @Column(DataType.DATEONLY)
  expectedCloseDate: string;

  @Default('open')
  @Column
  status: string; // open, won, lost

  @Default('cold')
  @Column
  temperature: string; // cold, warm, hot

  @Column(DataType.TEXT)
  lossReason: string;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.JSONB)
  extraFields: any;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Tag)
  @Column
  pipelineStageId: number; // A Tag que representa a coluna do Kanban

  @BelongsTo(() => Tag)
  stage: Tag;

  @HasMany(() => DealItem)
  items: DealItem[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Deal;