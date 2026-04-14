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

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "sprintify", 
  synchronize: false, // disabled to handle manually with migrations
  logging: ["error", "warn"], // comment out in prod
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
