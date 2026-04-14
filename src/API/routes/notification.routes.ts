import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";

/**
 * Routes for notification-related endpoints
 */
export class NotificationRoutes extends BaseRoute {
  public path = "/notifications";
  
  protected initRoutes(): void {
    const controller = container.resolve(NotificationController);

    this.router.get(
      "/",
      authenticate,
      controller.getNotifications.bind(controller)
    );

    // Get unread count
    this.router.get(
      "/unread-count",
      authenticate,
      controller.getUnreadCount.bind(controller)
    );

    // Get specific notification by ID
    this.router.get(
      "/:id",
      authenticate,
      controller.getNotificationById.bind(controller)
    );


    // Mark notification as read
    this.router.patch(
      "/:id/read",
      authenticate,
      controller.markAsRead.bind(controller)
    );

    // Mark all notifications as read
    this.router.patch(
      "/mark-all-read",
      authenticate,
      controller.markAllAsRead.bind(controller)
    );

    // Delete notification
    this.router.delete(
      "/:id",
      authenticate,
      controller.deleteNotification.bind(controller)
    );    // Create notification (admin/system use)
   
  }
}
