import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Project } from "./project.entity";
import { User } from "./user.entity";
import { ChatMessage } from "./chat-message.entity";

@Entity("chat_channels")
@Index(["projectId", "isDirectMessage"])
@Index(["createdBy"])
export class ChatChannel extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string; // Channel name (e.g., "General", "Backend Team")

  @Column({ nullable: true, length: 500 })
  description?: string;

  @Column({ default: false })
  isDirectMessage!: boolean; // true = DM, false = channel

  @Column({ nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project?: Project;

  @Column()
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "createdBy" })
  creator?: User;

  @OneToMany(() => ChatMessage, (message) => message.channel, {
    cascade: true,
  })
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
