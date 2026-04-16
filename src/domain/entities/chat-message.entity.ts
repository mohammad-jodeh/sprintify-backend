import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { ChatChannel } from "./chat-channel.entity";
import { User } from "./user.entity";

@Entity("chat_messages")
@Index(["channelId", "createdAt"])
@Index(["authorId"])
export class ChatMessage extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  channelId!: string;

  @ManyToOne(() => ChatChannel, (channel) => channel.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "channelId" })
  channel!: ChatChannel;

  @Column()
  authorId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: false })
  isEdited!: boolean;
}
