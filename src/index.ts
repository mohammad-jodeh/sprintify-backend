import "reflect-metadata";
import { AppDataSource } from "./infrastructure/database/data-source";
import { ensureDatabaseExists } from "./infrastructure/database/init-db";
import { registerDependencies } from "./infrastructure/database/container";
import { fixStatusProjectIdMigration } from "./infrastructure/database/migrations/fix-status-projectid";
import { AppServer } from "./API";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "DB_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("📋 Please set these in your .env file (copy from .env.example)");
  process.exit(1);
}

const dbConfig = {
  dbName: process.env.DB_NAME || "sprintify",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD!,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
};

(async () => {
  try {
    console.log("🚀 Starting Sprint API Server...");
    
    await registerDependencies();
    console.log("✅ Dependencies registered");
    
    console.log("🗄️  Setting up database...");
    await ensureDatabaseExists({
      dbName: dbConfig.dbName,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    // Initialize database connection (but don't sync yet)
    await AppDataSource.initialize();
    console.log("✅ Database connected");
    
    // Run data migrations before schema sync
    await fixStatusProjectIdMigration();
    console.log("✅ Migrations completed");
    
    // Now perform schema synchronization
    await AppDataSource.synchronize();
    console.log("✅ Database schema synced");

    const API = new AppServer();
    const port = process.env.PORT || 4000;
    API.listen(Number(port));
    console.log(`✅ 🚀 Server running at http://localhost:${port}`);
  } catch (error) {
    console.error("❌ FATAL ERROR during startup:");
    console.error(error);
    process.exit(1);
  }
})();
