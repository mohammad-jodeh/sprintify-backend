import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { ChatChannel } from "./chat-channel.entity";
import { User } from "./user.entity";

@Entity("chat_channel_members")
@Unique(["channelId", "userId"])
@Index(["userId"])
export class ChatChannelMember extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  channelId!: string;

  @ManyToOne(() => ChatChannel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel!: ChatChannel;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  joinedAt!: Date;
}
