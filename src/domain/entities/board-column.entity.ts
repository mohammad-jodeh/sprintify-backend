import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { BaseEntity, Project, Status } from ".";

@Entity("columns")
@Unique(["order", "projectId"])
export class BoardColumn extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 25 })
  name!: string;

  @Column({ type: "int" })
  order!: number;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId", referencedColumnName: "id" })
  project!: Project;

  @OneToMany(() => Status, (status) => status.column, { cascade: true })
  statuses!: Status[];
}
