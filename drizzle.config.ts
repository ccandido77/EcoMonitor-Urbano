// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
    ssl: {
      rejectUnauthorized: false // Permite SSL sem precisar do certificado CA local
    },
  },
});