import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { BaseEntity, Project, User, Issue } from ".";

@Entity("epics")
@Unique("Key_uniqueness_scoped_per_board", ["key", "projectId"])
export class Epic extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  key!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ nullable: true })
  assignee?: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "assignee", referencedColumnName: "id" })
  assigneeUser?: User;

  @Column()
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "projectId", referencedColumnName: "id" })
  project!: Project;

  @OneToMany(() => Issue, (issue) => issue.epic)
  issues!: Issue[];
}
