import "reflect-metadata";
import { AppDataSource } from "./infrastructure/database/data-source";
import { ensureDatabaseExists } from "./infrastructure/database/init-db";
import { registerDependencies } from "./infrastructure/database/container";
import { fixStatusProjectIdMigration } from "./infrastructure/database/migrations/fix-status-projectid";
import { AppServer } from "./API";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Check for database configuration (either DATABASE_URL for Railway or individual vars for local)
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasDbComponents = process.env.DB_PASSWORD && process.env.DB_USER && process.env.DB_HOST;

if (!hasDatabaseUrl && !hasDbComponents) {
  missingEnvVars.push("DATABASE_URL or (DB_PASSWORD, DB_USER, DB_HOST)");
}

if (missingEnvVars.length > 0) {
  console.error(
    `❌ FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("📋 For Railway: Set JWT_SECRET (DATABASE_URL is auto-provided)");
  console.error("📋 For local dev: Set DB_PASSWORD, DB_USER, DB_HOST, and JWT_SECRET in .env");
  process.exit(1);
}

// Parse database configuration
interface DbConfig {
  dbName: string;
  user: string;
  password: string;
  host: string;
  port: number;
}

let dbConfig: DbConfig;

if (hasDatabaseUrl) {
  // Railway mode: parse DATABASE_URL
  // Format: postgresql://user:password@host:port/database
  const url = new URL(process.env.DATABASE_URL!);
  dbConfig = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 5432,
    dbName: url.pathname.slice(1), // Remove leading slash
  };
  console.log("📡 Using DATABASE_URL from Railway");
} else {
  // Local dev mode: use individual variables
  dbConfig = {
    dbName: process.env.DB_NAME || "sprintify",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD!,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
  };
  console.log("📝 Using individual database configuration variables");
}

(async () => {
  try {
    console.log("🚀 Starting Sprint API Server...");
    
    await registerDependencies();
    console.log("✅ Dependencies registered");
    
    // Only ensure database exists in local dev mode
    // Railway manages the database automatically
    if (!hasDatabaseUrl) {
      console.log("🗄️  Setting up database...");
      await ensureDatabaseExists({
        dbName: dbConfig.dbName,
        user: dbConfig.user,
        password: dbConfig.password,
      });
    } else {
      console.log("✅ Database managed by Railway (skipping creation)");
    }

    // Initialize database connection (but don't sync yet)
    console.log("🗄️  Connecting to database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");
    
    // First: perform schema synchronization (creates tables)
    console.log("🗄️  Synchronizing database schema...");
    await AppDataSource.synchronize();
    console.log("✅ Database schema synced");
    
    // Then: run data migrations on existing tables
    await fixStatusProjectIdMigration();
    console.log("✅ Migrations completed");

    console.log("📡 Starting API server initialization...");
    const API = new AppServer();
    
    console.log("📡 Setting up routes...");
    const port = process.env.PORT || 4000;
    console.log(`📡 Listening on port ${port}...`);
    await API.listen(Number(port));  // MUST await here!
    console.log(`✅ 🚀 Server running at http://localhost:${port}`);
  } catch (error) {
    console.error("❌ FATAL ERROR during startup:");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    console.error("Full error:", error);
    process.exit(1);
  }
})();
