import { Notification } from "../entities/notification.entity";
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from "../DTOs/notificationDTO";

export interface INotificationRepo {
  create(dto: CreateNotificationDto): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByRecipientId(recipientId: string, query?: NotificationQueryDto): Promise<Notification[]>;
  update(id: string, dto: UpdateNotificationDto): Promise<Notification>;
  delete(id: string): Promise<void>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(recipientId: string): Promise<void>;
  getUnreadCount(recipientId: string): Promise<number>;
}
