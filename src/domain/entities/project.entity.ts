import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { BaseEntity, ProjectMember, Sprint, User } from ".";

@Entity("projects")
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 5, unique: true })
  keyPrefix!: string;

  @Column({ type: "uuid" })
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: false })
  @JoinColumn({ name: "createdBy" })
  creator?: User;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members!: ProjectMember[];

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints!: Sprint[];

  @OneToOne(() => Sprint, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "activeSprintId", referencedColumnName: "id" })
  activeSprint?: Sprint;
}
