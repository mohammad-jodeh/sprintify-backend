import "./loggerOverwrite";
import "./types";
import express, { Application } from "express";
import { BaseRoute } from "./routes/base.route";
import { glob } from "glob";
import path from "path";
import swaggerUi from "swagger-ui-express";
import errorMiddleware from "./middlewares/error.middleware";
import { sanitizeInput } from "./middlewares/sanitize.middleware";
import { createServer, Server as HttpServer } from "http";
import { container } from "tsyringe";
import { SocketService } from "../infrastructure/socket/socket.service";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";


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

    // HTTPS Redirect (in production)
    this.app.use((req, res, next) => {
      if (process.env.NODE_ENV === "production" && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
      }
      next();
    });

    // Body parser limit
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ limit: "10mb", extended: true }));

    // Input Sanitization - Prevent XSS attacks
    this.app.use(sanitizeInput);

    // Security Headers - Helmet provides comprehensive protection
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS Configuration - Allow production & all Vercel deployments
    const allowedOrigins = [
      "https://sprintify-frontend-blue.vercel.app", // Production frontend
      process.env.FRONTEND_URL,                      // Railway/custom domain
      "http://localhost:5173",                       // Local development
      "http://localhost:3000",                       // Alternative local port
      "http://127.0.0.1:5173",                       // Local IP
      "http://127.0.0.1:3000",                       // Local IP alt
    ].filter(Boolean); // Remove undefined values

    const corsOptions = {
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Allow specific whitelisted origins
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Allow all *.vercel.app domains (production and preview deployments)
        if (origin.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }

        // Reject all other origins
        callback(new Error("CORS not allowed for this origin: " + origin));
      },
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,  // Enable credentials (cookies, auth headers)
      optionsSuccessStatus: 200,
      preflightContinue: false,
    };

    // Apply CORS middleware (this handles preflight OPTIONS automatically)
    this.app.use(cors(corsOptions));

    // Compression Middleware - Reduce response size by 70-80%
    this.app.use(compression({
      level: 6, // Balance between speed and compression
      threshold: 1024, // Only compress responses > 1KB
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

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
    // Multiple health check endpoints for compatibility with different health checkers
    this.app.get("/", (_, res) => {
      res.send({ status: "ok", message: "Sprintify API is running" });
    });
    this.app.get("/health", (_, res) => {
      res.json({ status: "ok" });
    });
    this.app.get("/healthz", (_, res) => {
      res.json({ status: "ok" });
    });
    this.app.get("/health-check", (_, res) => {
      res.send({ status: "ok" });
    });
    this.app.get(`${this.apiPrefix}/health`, (_, res) => {
      res.json({ status: "ok" });
    });
    this.app.get(`${this.apiPrefix}/health-check`, (_, res) => {
      res.send({ status: "ok" });
    });

    console.debug(`🔍 Starting route discovery...`);
    
    // Support both ts-node-dev (TypeScript) and compiled (JavaScript) environments
    const pattern = process.env.NODE_ENV === "development" && process.argv.includes("ts-node-dev")
      ? "routes/!(base.route).ts"
      : "routes/!(base.route).js";
    
    console.debug(`🔍 Route pattern: ${pattern}`);
    console.debug(`🔍 Routes directory: ${path.resolve(__dirname, pattern)}`);
    
    const routeFiles = await glob(
      path.resolve(__dirname, pattern).replace(/\\/g, "/")
    );

    console.info(`Found ${routeFiles.length} route files to load`);

    for (const filePath of routeFiles) {
      console.debug(`🔍 Loading route file: ${filePath}`);
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
        // Log error but continue - don't re-throw so server can still start with health checks
        console.error(`❌ Error loading route file ${filePath}:`, error);
        console.warn(`⚠️  Route loading failed, but server will continue with other routes`);
      }
    }
    
    console.debug(`✅ All routes loaded, setupRoutes() complete`);
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
    try {
      await this.setupRoutes();
    } catch (setupError) {
      console.error(`⚠️  WARN: Failed to fully setup routes, but starting server anyway:`, setupError);
    }
    
    try {
      this.app.use(errorMiddleware);
    } catch (middlewareError) {
      console.error(`❌ ERROR setting up middleware:`, middlewareError);
    }
    
    // CRITICAL: Must wrap in Promise and resolve AFTER server binds to port
    return new Promise<void>((resolve) => {
      const server = this.httpServer.listen(port, () => {
        console.info(`🚀 Server running at http://localhost:${port}`);
        console.info(`✅ API is ready to accept requests`);
        resolve();  // ← Only resolve after port is actually bound
      });
      
      // Catch listen errors and log them
      server.on('error', (error: any) => {
        console.error(`❌ Server listen error on port ${port}:`, error.message);
        resolve();  // Still resolve so app doesn't hang
      });
    });
  }
}
