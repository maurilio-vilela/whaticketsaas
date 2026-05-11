import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  BelongsToMany // IMPORTAR ISSO
} from "sequelize-typescript";
import ContactCustomField from "./ContactCustomField";
import Ticket from "./Ticket";
import Company from "./Company";
import Schedule from "./Schedule";
import Whatsapp from "./Whatsapp";
import Tag from "./Tag"; // IMPORTAR MODEL TAG
import ContactTag from "./ContactTag"; // IMPORTAR MODEL PIVÔ

@Table
class Contact extends Model<Contact> {
  // ... (outros campos id, name, number, etc.)

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @AllowNull(false)
  @Unique
  @Column
  number: string;

  @AllowNull(true)
  @Default(null)
  @Column
  secondaryNumber: string;

  @AllowNull(false)
  @Default("")
  @Column
  email: string;

  @Default("")
  @Column
  profilePicUrl: string;

  @Default("")
  @Column
  remoteJid: string;

  @Default(false)
  @Column
  isGroup: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Ticket)
  tickets: Ticket[];

  @HasMany(() => ContactCustomField)
  extraInfo: ContactCustomField[];

  // --- ADICIONE ESTA RELAÇÃO ---
  @BelongsToMany(() => Tag, () => ContactTag)
  tags: Tag[];
  // -----------------------------

  @Default(true)
  @Column
  active: boolean;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Default(false)
  @Column
  disableBot: boolean

  @BelongsTo(() => Company)
  company: Company;
  
  // === NOVOS CAMPOS ===
  @Column
  gender: string;

  @Default("F")
  @Column
  personType: string;

  @Column
  cpf: string;

  @Column
  cnpj: string;

  @Column
  businessName: string;

  @Column
  birthdayDate: string; // Sequelize trata DATEONLY como string (YYYY-MM-DD)

  @Column
  state: string;

  @Column
  city: string;

  @Column
  address: string;

  @Column
  reference: string;
  // ====================

  @HasMany(() => Schedule, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    hooks: true
  })
  schedules: Schedule[];

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;
}

export default Contact;