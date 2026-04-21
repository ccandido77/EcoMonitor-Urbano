import 'dotenv/config'; // <-- Esta linha é mágica: ela lê o teu .env
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string, // Garante que lê do .env
  },
});