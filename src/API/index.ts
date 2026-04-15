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
    const corsOptions = {
      origin: "*", // Allow all origins
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: false, // Can't use true with origin: *
      optionsSuccessStatus: 200,
      allowedHeaders: "*",
    };

    this.app.use(cors(corsOptions));
    
    // CORS middleware handles preflight (OPTIONS) requests automatically

    // Rate Limiting - Global
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 requests per windowMs
      message: "Too many requests from this IP, please try again later",
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: any) => process.env.NODE_ENV === "development",
    });

    // Apply rate limiting globally (simpler and more reliable)
    this.app.use(generalLimiter);
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
      ? "routes/!(base.route).ts"
      : "routes/!(base.route).js";
    
    const routeFiles = await glob(
      path.resolve(__dirname, pattern).replace(/\\/g, "/")
    );

    console.info(`Found ${routeFiles.length} route files to load`);

    for (const filePath of routeFiles) {
      try {
        const module = await import(filePath);
        for (const exportedName in module) {
          const RouteClass = module[exportedName];
          if (
            typeof RouteClass === "function" &&
            Object.getPrototypeOf(RouteClass).name === "BaseRoute"
          ) {
            const routeInstance: BaseRoute = new RouteClass();
            
            // Validate path before registering
            if (!routeInstance.path || typeof routeInstance.path !== "string") {
              console.error(`❌ Invalid path for route ${exportedName}: "${routeInstance.path}"`);
              continue;
            }
            
            this.app.use(
              `${this.apiPrefix}${routeInstance.path}`,
              routeInstance.router
            );
            console.success(`Loaded route: ${routeInstance.path}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error loading route file ${filePath}:`, error);
        throw error; // Re-throw to prevent silent failures
      }
    }
  }
  private setupSocket(): void {
    try {
      const socketService = container.resolve<SocketService>("SocketService");
      socketService.initialize(this.httpServer);
    } catch (error) {
      console.error("❌ Error initializing Socket.IO:", error);
      // Continue anyway - Socket.IO is not critical for API to work
    }
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
