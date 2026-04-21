import "dotenv/config";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { occurrences, users } from "./schema";
import type {
  InsertOccurrence,
  InsertUser,
  OccurrenceCategory,
  OccurrenceStatus,
  SeverityLevel,
} from "./schema";

const pool = mysql.createPool(process.env.DATABASE_URL!);
const db = drizzle(pool);

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(data: InsertUser) {
  await db
    .insert(users)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        name: data.name,
        email: data.email,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      },
    });
  return getUserByOpenId(data.openId);
}

export async function getUserByOpenId(openId: string) {
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] ?? null;
}

// ─── Occurrences ─────────────────────────────────────────────────────────────

export interface OccurrenceFilters {
  category?: OccurrenceCategory;
  status?: OccurrenceStatus;
  severity?: SeverityLevel;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

function buildConditions(filters: OccurrenceFilters) {
  const conditions = [];
  if (filters.category) conditions.push(eq(occurrences.category, filters.category));
  if (filters.status) conditions.push(eq(occurrences.status, filters.status));
  if (filters.severity) conditions.push(eq(occurrences.severity, filters.severity));
  if (filters.userId != null) conditions.push(eq(occurrences.userId, filters.userId));
  if (filters.startDate) conditions.push(gte(occurrences.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(occurrences.createdAt, filters.endDate));
  return conditions;
}

export async function createOccurrence(data: InsertOccurrence) {
  const [result] = await db.insert(occurrences).values(data);
  const insertId = (result as { insertId: number }).insertId;
  const rows = await db.select().from(occurrences).where(eq(occurrences.id, insertId)).limit(1);
  return rows[0];
}

export async function listOccurrences(filters: OccurrenceFilters = {}) {
  const conditions = buildConditions(filters);
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const rows = await db
    .select({
      occurrence: occurrences,
      userName: users.name,
    })
    .from(occurrences)
    .leftJoin(users, eq(occurrences.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(occurrences.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ total: count() })
    .from(occurrences)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    items: rows.map((r) => ({ ...r.occurrence, userName: r.userName })),
    total: countRow?.total ?? 0,
  };
}

export async function getOccurrenceById(id: number) {
  const rows = await db
    .select({ occurrence: occurrences, userName: users.name })
    .from(occurrences)
    .leftJoin(users, eq(occurrences.userId, users.id))
    .where(eq(occurrences.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].occurrence, userName: rows[0].userName };
}

export async function updateOccurrenceStatus(
  id: number,
  status: OccurrenceStatus,
  resolvedAt?: Date
) {
  await db
    .update(occurrences)
    .set({ status, resolvedAt: resolvedAt ?? null })
    .where(eq(occurrences.id, id));
}

export async function updateOccurrenceAI(
  id: number,
  aiClassification: NonNullable<InsertOccurrence["aiClassification"]>
) {
  await db.update(occurrences).set({ aiClassification }).where(eq(occurrences.id, id));
}

export async function getOccurrenceStats(
  filters: Omit<OccurrenceFilters, "limit" | "offset"> = {}
) {
  const conditions = buildConditions(filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(occurrences)
    .where(whereClause);

  const byStatus = await db
    .select({ status: occurrences.status, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.status);

  const byCategory = await db
    .select({ category: occurrences.category, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.category);

  const bySeverity = await db
    .select({ severity: occurrences.severity, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.severity);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyTrend = await db
    .select({
      date: sql<string>`DATE(${occurrences.createdAt})`,
      total: count(),
    })
    .from(occurrences)
    .where(and(whereClause, gte(occurrences.createdAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${occurrences.createdAt})`)
    .orderBy(sql`DATE(${occurrences.createdAt})`);

  return {
    total: totalRow?.total ?? 0,
    byStatus,
    byCategory,
    bySeverity,
    dailyTrend,
  };
}

export async function getAllOccurrencesForExport(
  filters: Omit<OccurrenceFilters, "limit" | "offset"> = {}
) {
  const conditions = buildConditions(filters);

  const rows = await db
    .select({
      occurrence: occurrences,
      userName: users.name,
    })
    .from(occurrences)
    .leftJoin(users, eq(occurrences.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(occurrences.createdAt));

  return rows.map((r) => ({ ...r.occurrence, userName: r.userName }));
}
