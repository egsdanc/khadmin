import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@db/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '149.202.76.5',
  user: 'kilometr_s',
  password: process.env.MYSQL_PASSWORD || 'oCJ0ibbD6Cu1',
  database: process.env.MYSQL_DATABASE || 'kilometr_yedek',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(pool, { schema, mode: 'default' });