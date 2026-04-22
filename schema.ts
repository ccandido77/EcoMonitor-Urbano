import {
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Occurrences ────────────────────────────────────────────────────────────

export const OCCURRENCE_CATEGORIES = [
  "air_pollution",
  "water_pollution",
  "waste",
  "noise",
  "deforestation",
  "soil_contamination",
  "heat_island",
  "flooding",
  "geoglyph_degradation",
  "other",
] as const;

export type OccurrenceCategory = (typeof OCCURRENCE_CATEGORIES)[number];

export const OCCURRENCE_STATUSES = ["pending", "in_analysis", "resolved", "rejected"] as const;
export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const occurrences = mysqlTable("occurrences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),

  // Location
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),
  address: text("address"),

  // Classification
  category: mysqlEnum("category", OCCURRENCE_CATEGORIES).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", SEVERITY_LEVELS).default("medium").notNull(),
  status: mysqlEnum("status", OCCURRENCE_STATUSES).default("pending").notNull(),

  // Media
  imageUrl: text("imageUrl"), // Caminho da foto no servidor (/uploads/photos/...)
  imageKey: text("imageKey"), // Mantemos por compatibilidade, mas pode ser nulo
  audioUrl: text("audioUrl"), // Caminho do áudio no servidor (/uploads/audios/...)

  // AI Classification
  aiClassification: json("aiClassification").$type<{
    suggestedCategory: OccurrenceCategory;
    suggestedSeverity: SeverityLevel;
    confidence: number;
    reasoning: string;
    analyzedAt: string;
  }>(),

  // Reporter info (may be anonymous)
  reporterName: text("reporterName"),
  reporterEmail: varchar("reporterEmail", { length: 320 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Occurrence = typeof occurrences.$inferSelect;
export type InsertOccurrence = typeof occurrences.$inferInsert;
