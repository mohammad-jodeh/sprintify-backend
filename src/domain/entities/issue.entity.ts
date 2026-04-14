import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseEntity, Epic, Project, Sprint, Status, User } from ".";
import { IssueType,issuePriority } from "../types";

@Entity("issues")
export class Issue extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  key!: string;

  @Column({ length: 250 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "int" })
  storyPoint!: number;

  @Column({ nullable: true })
  statusId!: string;

  @Column({ nullable: true })
  assignee!: string;

  @Column({ nullable: true })
  epicId!: string;

  @Column({ nullable: true })
  sprintId!: string;

  @Column()
  projectId!: string;
    @Column({ type: "enum", enum: issuePriority, default: issuePriority.MEDIUM, nullable: false })
  issuePriority!: issuePriority;
  @Column({ type: "enum", enum: IssueType, default: IssueType.TASK })
  type!: IssueType;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "assignee", referencedColumnName: "id" })
  assigneeUser!: User;

  @ManyToOne(() => Project, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "projectId", referencedColumnName: "id" })
  project!: Project;

  @ManyToOne(() => Epic, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "epicId" })
  epic!: Epic;

  @ManyToOne(() => Sprint, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "sprintId" })
  sprint!: Sprint;

  @ManyToOne(() => Status, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "statusId" })
  status?: Status;
}
