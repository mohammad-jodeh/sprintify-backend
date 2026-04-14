import "./loggerOverwrite";
import "./types";
import express, { Application } from "express";
import { BaseRoute } from "./routes/base.route";
import { glob } from "glob";
import path from "path";
import swaggerUi from "swagger-ui-express";
import errorMiddleware from "./middlewares/error.middleware";
import { createServer, Server as HttpServer } from "http";
import { container } from "tsyringe";
import { SocketService } from "../infrastructure/socket/socket.service";
import cors from "cors";
import rateLimit from "express-rate-limit";


export class AppServer {
  public app: Application;
  public httpServer: HttpServer;
  private readonly apiPrefix = "/api/v1";
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.setupMiddleware();
    this.setupSocket(); // Initialize Socket.IO server
  }

  private setupMiddleware() {
    // Trust proxy for HTTPS
    this.app.set("trust proxy", 1);

    // Body parser limit
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ limit: "10mb", extended: true }));

    // Security Headers
    this.app.use((req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      next();
    });

    // CORS Configuration
    const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (process.env.NODE_ENV === "development") {
          // Allow all in development
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
      optionsSuccessStatus: 200,
    };

    this.app.use(cors(corsOptions));

    // Rate Limiting
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later",
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      skip: (req: any) => process.env.NODE_ENV === "development", // Skip rate limiting in development
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Only 5 login attempts
      skipSuccessfulRequests: true, // Don't count successful requests
      skip: (req: any) => process.env.NODE_ENV === "development", // Skip rate limiting in development
      message: "Too many login attempts, please try again after 15 minutes",
    });

    // Apply general limiter to all API routes
    this.app.use(`${this.apiPrefix}/`, generalLimiter);

    // Apply stricter limiter to authentication endpoints
    this.app.use(`${this.apiPrefix}/user/login`, authLimiter);
    this.app.use(`${this.apiPrefix}/user/register`, authLimiter);
  }

  private async setupRoutes() {
    this.app.get("/health-check", (_, res) => {
      res.send({ status: "ok" });
    });
    this.app.get(`${this.apiPrefix}/health-check`, (_, res) => {
      res.send({ status: "ok" });
    });

    // Support both ts-node-dev (TypeScript) and compiled (JavaScript) environments
    const pattern = process.env.NODE_ENV === "development" && process.argv.includes("ts-node-dev")
      ? "routes/*.ts"
      : "routes/*.js";
    
    const routeFiles = await glob(
      path.resolve(__dirname, pattern).replace(/\\/g, "/")
    );

    console.info(`Found ${routeFiles.length} route files to load`);

    for (const filePath of routeFiles) {
      const module = await import(filePath);
      for (const exportedName in module) {
        const RouteClass = module[exportedName];
        if (
          typeof RouteClass === "function" &&
          Object.getPrototypeOf(RouteClass).name === "BaseRoute"
        ) {
          const routeInstance: BaseRoute = new RouteClass();
          this.app.use(
            `${this.apiPrefix}${routeInstance.path}`,
            routeInstance.router
          );
          console.success(`Loaded route: ${routeInstance.path}`);
        }
      }
    }
  }
  private setupSocket(): void {
    const socketService = container.resolve<SocketService>("SocketService");
    socketService.initialize(this.httpServer);
  }

  public async listen(port: number): Promise<void> {
    await this.setupRoutes();
    //*this middleware cant be registered in setupMiddlewares because it needs to be the last middleware
    this.app.use(errorMiddleware);
    this.httpServer.listen(port, () =>
      console.info(`🚀 Server running at http://localhost:${port}`)
    );
  }
}
