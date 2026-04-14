import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsObject, IsUrl, IsDateString } from "class-validator";
import { NotificationType, NotificationPriority } from "../types/enums";

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsUUID()
  recipientId!: string;

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;

  @IsBoolean()
  @IsOptional()
  emailSent?: boolean;


}

export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  emailSent?: boolean;
}

export class NotificationResponseDto {
  id!: string;
  title!: string;
  message!: string;
  type!: NotificationType;
  priority!: NotificationPriority;
  recipientId!: string;
  senderId?: string;
  isRead!: boolean;
  metadata?: Record<string, any>;
  actionUrl?: string;
  emailSent!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class NotificationQueryDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

/**
 * DTO for sending a notification to a single user
 */
export class SendNotificationDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsUUID()
  recipientId!: string;

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;

  @IsDateString()
  @IsOptional()
  scheduleFor?: Date;
}

/**
 * DTO for sending notifications to multiple users
 */
export class SendNotificationToUsersDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsUUID(4, { each: true })
  recipientIds!: string[];

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;
}

/**
 * DTO for sending notifications to all members of a project
 */
export class SendProjectNotificationDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsUUID()
  projectId!: string;

  @IsUUID(4, { each: true })
  memberIds!: string[];

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;
}
