import "dotenv/config";
import { Pool } from "pg";

export function PoolConn()  {
  const pool: Pool = new Pool({
    connectionString: process.env.DATABASE_URL as string,
    max: 15, 
  });
  return pool;
}
