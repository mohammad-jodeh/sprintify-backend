import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { injectable } from "tsyringe";
import jwt from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JwtPayload {
  id: string; // Match the JWT token payload structure
  email: string;
  isEmailVerified: boolean;
  tokenType?: string;
  exp?: number;
  iat?: number;
}

/**
 * Service for managing Socket.IO connections and real-time communication
 */
@injectable()
export class SocketService {
  private io?: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  /**
   * Initialize the Socket.IO server with authentication and event handlers
   * @param httpServer - The HTTP server instance to attach Socket.IO to
   */
  initialize(httpServer: HttpServer): void {
    // CORS origin checker for Socket.IO
    const corsOriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        "https://sprintify-frontend-blue.vercel.app",
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ];

      // Allow no origin (important for local development)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow whitelisted origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Allow all *.vercel.app preview deployments
      if (origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }

      callback(null, false);
    };

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOriginCheck,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization"],
      },
      allowEIO3: true, // Allow Engine.IO v3 clients
      transports: ["websocket", "polling"],
      pingTimeout: 20000, // Reduce from 60s to 20s for faster disconnect detection
      pingInterval: 10000, // Send ping every 10s (was 25s)
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6,
      connectTimeout: 45000, // Max time to wait for initial connection
      // Enable polling timeout handling
      serveClient: false, // Don't serve Socket.IO client files
    });

    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });

    //TODO: Add error handling
    this.io.on("error", (error) => {
      console.error("🔌 Socket.IO server error:", error);
    });

    this.io.engine.on("connection_error", (err) => {
      console.error("🔌 Socket.IO connection error:", err.req);
      console.error("🔌 Error code:", err.code);
      console.error("🔌 Error message:", err.message);
      console.error("🔌 Error context:", err.context);
    });

    console.success("🔌 Socket.IO initialized successfully");
  }

  /**
   * Authenticate socket connections using JWT tokens
   * @param socket - The socket connection to authenticate
   * @param next - Callback function to continue or reject the connection
   */ private authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): void {
    try {
      // Try to get token from multiple sources
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "") ||
        socket.handshake.query.token;

      if (!token) {
        console.error("🔌 Authentication failed: No token provided");
        return next(new Error("Authentication token required"));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("🔌 Authentication failed: Required environment variable not configured");
        return next(new Error("Server configuration error"));
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      socket.userId = decoded.id;
      next();
    } catch (error) {
      console.error(
        "🔌 Socket authentication error:",
        (error as Error).message
      );
      next(new Error("Invalid authentication token"));
    }
  }

  /**
   * Handle new socket connections
   * @param socket - The authenticated socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    // Add socket to user's socket list
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socket.id);

    console.info(`🔌 User ${userId} connected with socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });

    // Handle joining project rooms
    socket.on("join-project", (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.info(`🔌 User ${userId} joined project room: ${projectId}`);
    });

    // Handle leaving project rooms
    socket.on("leave-project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.info(`🔌 User ${userId} left project room: ${projectId}`);
    });

    // Handle joining chat channels
    socket.on("join-channel", (channelId: string) => {
      socket.join(`channel:${channelId}`);
      console.log(`✅ [SOCKET] User ${userId} joined channel room: channel:${channelId}`);
      console.log(`📊 [SOCKET-ROOMS] Socket ${socket.id} rooms:`, socket.rooms);
      
      // Notify others in the channel
      this.io?.to(`channel:${channelId}`).emit("user-joined", { userId });
    });

    // Handle leaving chat channels
    socket.on("leave-channel", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`❌ [SOCKET] User ${userId} left channel room: channel:${channelId}`);
      
      // Notify others in the channel
      this.io?.to(`channel:${channelId}`).emit("user-left", { userId });
    });

    // Handle new messages
    socket.on("send-message", (data: { channelId: string; content: string }) => {
      // Broadcast message to channel
      this.io?.to(`channel:${data.channelId}`).emit("message-received", {
        channelId: data.channelId,
        content: data.content,
        userId,
      });
    });

    // Handle typing indicator
    socket.on("typing", (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit("user-typing", { userId });
    });

    // Handle stop typing
    socket.on("stop-typing", (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit("user-stopped-typing", { userId });
    });
  }

  /**
   * Handle socket disconnections
   * @param socket - The socket being disconnected
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const userSocketIds = this.userSockets.get(userId);

    if (userSocketIds) {
      const index = userSocketIds.indexOf(socket.id);
      if (index > -1) {
        userSocketIds.splice(index, 1);
      }

      if (userSocketIds.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    console.info(`🔌 User ${userId} disconnected from socket ${socket.id}`);
  }
  /**
   * Send notification to specific user
   * @param userId - The user ID to send the notification to
   * @param event - The event name
   * @param data - The notification data
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) {
      console.error(
        `🔔 Cannot emit to user ${userId}: Socket.IO not initialized`
      );
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.info(`🔔 Notification sent to user ${userId}: ${event}`);
  }

  /**
   * Send notification to all users in a project
   * @param projectId - The project ID
   * @param event - The event name
   * @param data - The notification data
   */
  emitToProject(projectId: string, event: string, data: unknown): void {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit(event, data);
    console.info(`🔔 Notification sent to project ${projectId}: ${event}`);
  }

  /**
   * Send notification to multiple users
   * @param userIds - Array of user IDs to send notifications to
   * @param event - The event name
   * @param data - The notification data
   */
  emitToUsers(userIds: string[], event: string, data: unknown): void {
    if (!this.io) return;

    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Broadcast to all connected users
   * @param event - The event name
   * @param data - The notification data
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) return;

    this.io.emit(event, data);
    console.info(`🔔 Broadcast notification sent: ${event}`);
  }

  /**
   * Get the Socket.IO server instance
   * @returns The Socket.IO server instance or undefined
   */
  getIO(): SocketIOServer | undefined {
    return this.io;
  }

  /**
   * Get online users count
   * @returns The number of online users
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is online
   * @param userId - The user ID to check
   * @returns True if user is online, false otherwise
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get all online user IDs
   * @returns Array of online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
