import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Company from './Company';
import User from './User';
import Ticket from './Ticket';
import Contact from './Contact';
import Deal from './Deal';

@Table({ tableName: 'Tasks', timestamps: true, underscored: true })
class Task extends Model<Task> {
  @PrimaryKey
  @AutoIncrement
  @Column({ field: 'id' })
  id!: number;

  @Column({ field: 'text', allowNull: false })
  text!: string;

  @Column({ field: 'description', allowNull: true }) // Adicionada coluna description, opcional (pode ser nula)
  description!: string | null;

  @Column({ field: 'due_date', allowNull: false })
  dueDate!: Date;

  @Default('Medium')
  @Column({ field: 'priority', type: DataType.ENUM('High', 'Medium', 'Low'), allowNull: false })
  priority!: 'High' | 'Medium' | 'Low';

  @Default(false)
  @Column({ field: 'completed', allowNull: false })
  completed!: boolean;

  @Default('todo')
  @Column({ field: 'status', type: DataType.ENUM('todo', 'doing', 'done'), allowNull: false })
  status!: 'todo' | 'doing' | 'done';

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  @ForeignKey(() => Company)
  @Column({ field: 'company_id', allowNull: false })
  companyId!: number;

  @BelongsTo(() => Company)
  company!: Company;

  @ForeignKey(() => User)
  @Column({ field: 'user_id', allowNull: false })
  userId!: number; // Usuário que criou a tarefa

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => User)
  @Column({ field: 'assigned_user_id', allowNull: true })
  assignedUserId!: number | null; // Usuário designado para executar a tarefa (pode ser nulo)

  @BelongsTo(() => User, { foreignKey: 'assigned_user_id' })
  assignedUser!: User; // Relação com o usuário designado
  @ForeignKey(() => Ticket)
  @Column({ field: "ticket_id", allowNull: true })
  ticketId!: number | null;

  @BelongsTo(() => Ticket)
  ticket!: Ticket;

  @ForeignKey(() => Contact)
  @Column({ field: "contact_id", allowNull: true })
  contactId!: number | null;

  @BelongsTo(() => Contact)
  contact!: Contact;

  @ForeignKey(() => Deal)
  @Column({ field: "deal_id", allowNull: true })
  dealId!: number | null;

  @BelongsTo(() => Deal)
  deal!: Deal;
}

export default Task;