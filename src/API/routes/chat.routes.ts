import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { ChatController } from "../controllers/chat.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";

export class ChatRoutes extends BaseRoute {
  public path = "/chat";

  protected initRoutes(): void {
    const controller = container.resolve(ChatController);

    // Create channel for a project
    this.router.post(
      "/channels",
      authenticate,
      controller.createChannel.bind(controller)
    );

    // Get all channels for a project
    this.router.get(
      "/channels/:projectId",
      authenticate,
      controller.getChannels.bind(controller)
    );

    // Get messages from a channel
    this.router.get(
      "/:channelId/messages",
      authenticate,
      controller.getMessages.bind(controller)
    );

    // Send a message to channel
    this.router.post(
      "/:channelId/messages",
      authenticate,
      controller.sendMessage.bind(controller)
    );

    // Edit a message
    this.router.patch(
      "/messages/:messageId",
      authenticate,
      controller.editMessage.bind(controller)
    );

    // Delete a message
    this.router.delete(
      "/messages/:messageId",
      authenticate,
      controller.deleteMessage.bind(controller)
    );

    // Add member to channel
    this.router.post(
      "/:channelId/members",
      authenticate,
      controller.addMember.bind(controller)
    );

    // Remove member from channel
    this.router.delete(
      "/:channelId/members",
      authenticate,
      controller.removeMember.bind(controller)
    );
  }
}
