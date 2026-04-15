import { DataSource } from "typeorm";
import {
  BoardColumn,
  Epic,
  Issue,
  Notification,
  Project,
  ProjectMember,
  Sprint,
  Status,
  User,
} from "../../domain/entities";
import dotenv from "dotenv";
dotenv.config();

// Parse database configuration from DATABASE_URL (Railway) or individual variables (local)
let dbConfig: any;

if (process.env.DATABASE_URL) {
  // Railway mode: use DATABASE_URL directly
  dbConfig = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: ["error", "warn"],
  };
} else {
  // Local dev mode: use individual variables
  dbConfig = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "sprintify",
    synchronize: false,
    logging: ["error", "warn"],
  };
}

export const AppDataSource = new DataSource({
  ...dbConfig,
  entities: [
    BoardColumn,
    Epic,
    Issue,
    Notification,
    Project,
    ProjectMember,
    Sprint,
    Status,
    User,
  ],
});
