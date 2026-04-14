import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from "typeorm";
import { BaseEntity, Issue, ProjectMember } from ".";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 255 })
  @Index() // typeOrm already create index for unique attr - this is mostly for clarity
  email!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 100 })
  fullName!: string;

  @Column({ nullable: true, length: 500 })
  image?: string;

  @OneToMany(() => Issue, (issue) => issue.assigneeUser)
  issues!: Issue[];

  projectMemberships!: ProjectMember[];
}
