import { injectable } from "tsyringe";
import { AppDataSource } from "../data-source";
import { Notification } from "../../../domain/entities/notification.entity";
import { INotificationRepo } from "../../../domain/IRepos/INotificationRepo";
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from "../../../domain/DTOs/notificationDTO";
import { getDBError } from "../utils/handleDBErrors";
import { UserError, ServerError } from "../../../app/exceptions";

/**
 * Repository implementation for managing notification data persistence
 */
@injectable()
export class NotificationRepo implements INotificationRepo {
  private readonly repository = AppDataSource.getRepository(Notification);

  /**
   * Create a new notification
   * @param dto - The notification creation data
   * @returns Promise<Notification> - The created notification
   * @throws ServerError - If database operation fails
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.repository.create(dto);
      return await this.repository.save(notification);
    } catch (error: unknown) {
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to create notification");
    }
  }

  /**
   * Find a notification by its ID
   * @param id - The notification ID
   * @returns Promise<Notification | null> - The notification or null if not found
   * @throws ServerError - If database operation fails
   */
  async findById(id: string): Promise<Notification | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ["recipient", "sender"],
      });
    } catch (error: unknown) {
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to find notification");
    }
  }

  /**
   * Find notifications by recipient ID with optional filtering
   * @param recipientId - The recipient user ID
   * @param query - Optional query parameters for filtering
   * @returns Promise<Notification[]> - Array of notifications
   * @throws ServerError - If database operation fails
   */
  async findByRecipientId(
    recipientId: string,
    query?: NotificationQueryDto
  ): Promise<Notification[]> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder("notification")
        .leftJoinAndSelect("notification.recipient", "recipient")
        .leftJoinAndSelect("notification.sender", "sender")
        .where("notification.recipientId = :recipientId", { recipientId })
        .orderBy("notification.createdAt", "DESC");

      if (query?.isRead !== undefined) {
        queryBuilder.andWhere("notification.isRead = :isRead", {
          isRead: query.isRead,
        });
      }

      if (query?.type) {
        queryBuilder.andWhere("notification.type = :type", {
          type: query.type,
        });
      }

      if (query?.priority) {
        queryBuilder.andWhere("notification.priority = :priority", {
          priority: query.priority,
        });
      }

      if (query?.page && query?.limit) {
        const skip = (query.page - 1) * query.limit;
        queryBuilder.skip(skip).take(query.limit);
      }

      return await queryBuilder.getMany();
    } catch (error: unknown) {
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to find notifications");
    }
  }

  /**
   * Update a notification
   * @param id - The notification ID
   * @param dto - The update data
   * @returns Promise<Notification> - The updated notification
   * @throws UserError - If notification not found
   * @throws ServerError - If database operation fails
   */
  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.findById(id);
      if (!notification) {
        throw new UserError("Notification not found");
      }

      Object.assign(notification, dto);
      return await this.repository.save(notification);
    } catch (error: unknown) {
      if (error instanceof UserError) throw error;
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to update notification");
    }
  }

  /**
   * Delete a notification
   * @param id - The notification ID
   * @returns Promise<void>
   * @throws UserError - If notification not found
   * @throws ServerError - If database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw new UserError("Notification not found");
      }
    } catch (error: unknown) {
      if (error instanceof UserError) throw error;
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to delete notification");
    }
  }

  /**
   * Mark a notification as read
   * @param id - The notification ID
   * @returns Promise<Notification> - The updated notification
   */
  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { isRead: true });
  }

  /**
   * Mark all notifications as read for a recipient
   * @param recipientId - The recipient user ID
   * @returns Promise<void>
   * @throws ServerError - If database operation fails
   */
  async markAllAsRead(recipientId: string): Promise<void> {
    try {
      await this.repository
        .createQueryBuilder()
        .update(Notification)
        .set({ isRead: true })
        .where("recipientId = :recipientId AND isRead = false", { recipientId })
        .execute();
    } catch (error: unknown) {
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to mark all as read");
    }
  }

  /**
   * Get unread notification count for a recipient
   * @param recipientId - The recipient user ID
   * @returns Promise<number> - The count of unread notifications
   * @throws ServerError - If database operation fails
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { recipientId, isRead: false },
      });
    } catch (error: unknown) {
      const dbError = getDBError(error);
      throw new ServerError(dbError.message || "Failed to get unread count");
    }
  }
}

