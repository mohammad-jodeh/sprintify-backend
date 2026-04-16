import { injectable, inject } from "tsyringe";
import { AppDataSource } from "../../infrastructure/database/data-source";
import {
  ChatChannel,
  ChatMessage,
  ChatChannelMember,
} from "../../domain/entities";
import { User } from "../../domain/entities";
import { UserError } from "../exceptions";

@injectable()
export class ChatService {
  async createChannel(
    name: string,
    projectId: string,
    createdBy: string,
    description?: string,
    isDirectMessage: boolean = false
  ): Promise<ChatChannel> {
    const channelRepo = AppDataSource.getRepository(ChatChannel);
    
    // Check if channel already exists for this project
    const exists = await channelRepo.findOne({
      where: { name, projectId },
    });

    if (exists) {
      throw new UserError(["Channel with this name already exists"], 400);
    }

    const channel = channelRepo.create({
      name,
      projectId,
      createdBy,
      description,
      isDirectMessage,
    });

    await channelRepo.save(channel);

    // Add creator as member
    await this.addMember(channel.id, createdBy);

    return channel;
  }

  async getChannels(projectId: string, userId: string): Promise<ChatChannel[]> {
    const channelRepo = AppDataSource.getRepository(ChatChannel);
    
    return channelRepo
      .createQueryBuilder("channel")
      .leftJoinAndSelect("channel.messages", "messages")
      .leftJoinAndSelect("messages.author", "author")
      .where("channel.projectId = :projectId", { projectId })
      .orderBy("channel.createdAt", "DESC")
      .addOrderBy("messages.createdAt", "DESC")
      .getMany();
  }

  async getChannelMessages(
    channelId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    const messageRepo = AppDataSource.getRepository(ChatMessage);

    return messageRepo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.author", "author")
      .where("message.channelId = :channelId", { channelId })
      .orderBy("message.createdAt", "DESC")
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async sendMessage(
    channelId: string,
    authorId: string,
    content: string
  ): Promise<ChatMessage> {
    const messageRepo = AppDataSource.getRepository(ChatMessage);
    const channelRepo = AppDataSource.getRepository(ChatChannel);

    // Verify channel exists
    const channel = await channelRepo.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new UserError(["Channel not found"], 404);
    }

    // Verify user is member of channel
    const memberRepo = AppDataSource.getRepository(ChatChannelMember);
    const membership = await memberRepo.findOne({
      where: { channelId, userId: authorId },
    });

    if (!membership) {
      await this.addMember(channelId, authorId);
    }

    const message = messageRepo.create({
      channelId,
      authorId,
      content,
    });

    await messageRepo.save(message);

    // Return with author details
    return messageRepo.findOne({
      where: { id: message.id },
      relations: ["author"],
    }) as Promise<ChatMessage>;
  }

  async addMember(channelId: string, userId: string): Promise<void> {
    const memberRepo = AppDataSource.getRepository(ChatChannelMember);

    // Check if already a member
    const exists = await memberRepo.findOne({
      where: { channelId, userId },
    });

    if (exists) {
      return;
    }

    const member = memberRepo.create({
      channelId,
      userId,
    });

    await memberRepo.save(member);
  }

  async removeMember(channelId: string, userId: string): Promise<void> {
    const memberRepo = AppDataSource.getRepository(ChatChannelMember);
    
    await memberRepo.delete({
      channelId,
      userId,
    });
  }

  async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<ChatMessage> {
    const messageRepo = AppDataSource.getRepository(ChatMessage);

    const message = await messageRepo.findOne({
      where: { id: messageId },
      relations: ["author"],
    });

    if (!message) {
      throw new UserError(["Message not found"], 404);
    }

    if (message.authorId !== userId) {
      throw new UserError(["You can only edit your own messages"], 403);
    }

    message.content = newContent;
    message.isEdited = true;

    await messageRepo.save(message);
    return message;
  }

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRepo = AppDataSource.getRepository(ChatMessage);

    const message = await messageRepo.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new UserError(["Message not found"], 404);
    }

    if (message.authorId !== userId) {
      throw new UserError(["You can only delete your own messages"], 403);
    }

    await messageRepo.delete({ id: messageId });
  }
}
