import { injectable, inject } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../../app/services/notification.service";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CreateNotificationDto, NotificationQueryDto } from "../../domain/DTOs/notificationDTO";
import { UserError } from "../../app/exceptions";

/**
 * Controller for handling notification-related HTTP requests
 */
@injectable()
export class NotificationController {
  /**
   * Constructor for NotificationController
   * @param notificationService - The notification service
   */
  constructor(@inject(NotificationService) private notificationService: NotificationService) {}

  /**
   * Get notifications for the authenticated user
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const query = plainToInstance(NotificationQueryDto, req.query);
      
      const errors = await validate(query);
      if (errors.length) {
        throw new UserError(errors);
      }

      const notifications = await this.notificationService.findByRecipientId(userId, query);
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.json({
        notifications,
        unreadCount,
        pagination: query.page && query.limit ? {
          page: query.page,
          limit: query.limit,
        } : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific notification by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      
      const notification = await this.notificationService.findById(id);
      
      if (!notification) {
        throw new UserError("Notification not found");
      }

      // Check if user is the recipient
      if (notification.recipientId !== userId) {
        throw new UserError("Access denied");
      }

      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      
      const notification = await this.notificationService.findById(id);
      
      if (!notification) {
        throw new UserError("Notification not found");
      }

      // Check if user is the recipient
      if (notification.recipientId !== userId) {
        throw new UserError("Access denied");
      }

      const updatedNotification = await this.notificationService.markAsRead(id);
      
      res.json({
        message: "Notification marked as read",
        notification: updatedNotification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read for the authenticated user
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      
      await this.notificationService.markAllAsRead(userId);
      
      res.json({
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      
      const notification = await this.notificationService.findById(id);
      
      if (!notification) {
        throw new UserError("Notification not found");
      }

      // Check if user is the recipient
      if (notification.recipientId !== userId) {
        throw new UserError("Access denied");
      }

      await this.notificationService.delete(id);
      
      res.json({
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count for the authenticated user
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      
      res.json({ unreadCount });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new notification (admin/sender functionality)
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Promise<void>
   */
  async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = plainToInstance(CreateNotificationDto, req.body);
      const errors = await validate(dto);
      
      if (errors.length) {
        throw new UserError(errors);
      }      // Set sender as current user if not provided
      if (!dto.senderId) {
        dto.senderId = req.user?.id;
      }

      const notification = await this.notificationService.create(dto);
      
      res.status(201).json({
        message: "Notification created successfully",
        notification,
      });
    } catch (error) {
      next(error);
    }
  }
}
