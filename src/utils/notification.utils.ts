/**
 * @fileoverview Notification utility functions for easy access throughout the application
 * @author System
 * @version 1.0.0
 */

import { NotificationService } from "../app/services/notification.service";
import { NotificationType, NotificationPriority } from "../domain/types/enums";
import { container } from "tsyringe";

/**
 * Send a notification to a single user
 * @param userId - The ID of the user to notify
 * @param notificationData - The notification data
 * @returns Promise<void>
 * @example
 * ```typescript
 * import { sendNotification } from '../utils/notification.utils';
 * 
 * await sendNotification('user123', {
 *   title: 'Welcome!',
 *   message: 'Welcome to our platform',
 *   type: NotificationType.SYSTEM
 * });
 * ```
 */
export async function sendNotification(
  userId: string,
  notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    senderId?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
    scheduleFor?: Date;
  }
): Promise<void> {
  const notificationService = container.resolve(NotificationService);
  await notificationService.create({
    ...notificationData,
    recipientId: userId,
  });
}

/**
 * Send a notification to multiple users
 * @param userIds - Array of user IDs to notify
 * @param notificationData - The notification data
 * @returns Promise<void>
 * @example
 * ```typescript
 * import { sendNotificationToUsers } from '../utils/notification.utils';
 * 
 * await sendNotificationToUsers(['user1', 'user2'], {
 *   title: 'Team Update',
 *   message: 'New project assigned to your team',
 *   type: NotificationType.SYSTEM
 * });
 * ```
 */
export async function sendNotificationToUsers(
  userIds: string[],
  notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    senderId?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
  }
): Promise<void> {
  const notificationService = container.resolve(NotificationService);
  for (const userId of userIds) {
    await notificationService.create({
      ...notificationData,
      recipientId: userId,
    });
  }
}

/**
 * Send a notification to all members of a project
 * @param projectId - The ID of the project
 * @param memberIds - Array of project member IDs
 * @param notificationData - The notification data
 * @returns Promise<void>
 * @example
 * ```typescript
 * import { sendProjectNotification } from '../utils/notification.utils';
 * 
 * await sendProjectNotification('project123', ['user1', 'user2'], {
 *   title: 'Task Completed',
 *   message: 'A task has been marked as completed',
 *   type: NotificationType.TASK
 * });
 * ```
 */
export async function sendProjectNotification(
  projectId: string,
  memberIds: string[],
  notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    senderId?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, unknown>;
    actionUrl?: string;
  }
): Promise<void> {
  const notificationService = container.resolve(NotificationService);
  for (const memberId of memberIds) {
    await notificationService.create({
      ...notificationData,
      recipientId: memberId,
      metadata: {
        ...notificationData.metadata,
        projectId,
      },
    });
  }
}
