import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { ChatService } from "../../app/services/chat.service";
import { CreateChatChannelDto, SendChatMessageDto } from "../../domain/DTOs/chatDTO";
import { validate } from "class-validator";

@injectable()
export class ChatController {
  constructor(@inject(ChatService) private chatService: ChatService) {}

  async createChannel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const dto = Object.assign(new CreateChatChannelDto(), req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({ errors, success: false });
        return;
      }

      const channel = await this.chatService.createChannel(
        dto.name,
        dto.projectId,
        userId,
        dto.description,
        dto.isDirectMessage
      );

      res.status(201).json({ data: channel, success: true });
    } catch (error) {
      next(error);
    }
  }

  async getChannels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { projectId } = req.params as { projectId: string };

      if (!projectId) {
        res.status(400).json({ message: "Project ID is required", success: false });
        return;
      }

      const channels = await this.chatService.getChannels(projectId, userId);

      res.status(200).json({ data: channels, success: true });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { channelId } = req.params as { channelId: string };
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      if (!channelId) {
        res.status(400).json({ message: "Channel ID is required", success: false });
        return;
      }

      const messages = await this.chatService.getChannelMessages(
        channelId,
        limit,
        offset
      );

      res.status(200).json({ data: messages, success: true });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { channelId } = req.params as { channelId: string };
      const dto = Object.assign(new SendChatMessageDto(), req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({ errors, success: false });
        return;
      }

      const message = await this.chatService.sendMessage(
        channelId,
        userId,
        dto.content
      );

      res.status(201).json({ data: message, success: true });
    } catch (error) {
      next(error);
    }
  }

  async editMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { messageId } = req.params as { messageId: string };
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ message: "Message content is required", success: false });
        return;
      }

      const message = await this.chatService.editMessage(messageId, userId, content);

      res.status(200).json({ data: message, success: true });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { messageId } = req.params as { messageId: string };

      await this.chatService.deleteMessage(messageId, userId);

      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async addMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { channelId } = req.params as { channelId: string };
      const { memberId } = req.body;

      if (!memberId) {
        res.status(400).json({ message: "Member ID is required", success: false });
        return;
      }

      await this.chatService.addMember(channelId, memberId);

      res.status(200).json({ message: "Member added successfully", success: true });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Not authenticated", success: false });
        return;
      }

      const { channelId } = req.params as { channelId: string };
      const { memberId } = req.body;

      if (!memberId) {
        res.status(400).json({ message: "Member ID is required", success: false });
        return;
      }

      await this.chatService.removeMember(channelId, memberId);

      res.status(200).json({ message: "Member removed successfully", success: true });
    } catch (error) {
      next(error);
    }
  }
}
