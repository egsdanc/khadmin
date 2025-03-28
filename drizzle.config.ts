import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.MYSQL_HOST || "149.202.76.5",
    user: "kilometr_s",
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "kilometr_yedek"
  }
});