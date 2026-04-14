import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity, Project } from ".";

/**
 * Sprint entity representing a project sprint
 */
@Entity("sprints")
export class Sprint extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 25 })
  name!: string;

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;
  @Column()
  projectId!: string;

  @Column({ default: false })
  archived!: boolean;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId", referencedColumnName: "id" })
  project!: Project;
}
