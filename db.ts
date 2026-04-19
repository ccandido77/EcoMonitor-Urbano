  offset?: number;
}

export async function createOccurrence(data: InsertOccurrence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(occurrences).values(data);
  const insertId = (result as any).insertId as number;
  const rows = await db.select().from(occurrences).where(eq(occurrences.id, insertId)).limit(1);
  return rows[0];
}

export async function listOccurrences(filters: OccurrenceFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(occurrences)
    .set({ status, resolvedAt: resolvedAt ?? null })
    .where(eq(occurrences.id, id));
}

export async function updateOccurrenceAI(
  id: number,
  aiClassification: NonNullable<InsertOccurrence["aiClassification"]>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(occurrences).set({ aiClassification }).where(eq(occurrences.id, id));
}

export async function getOccurrenceStats(filters: Omit<OccurrenceFilters, "limit" | "offset"> = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = buildConditions(filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(occurrences)
    .where(whereClause);

  // By status
  const byStatus = await db
    .select({ status: occurrences.status, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.status);

  // By category
  const byCategory = await db
    .select({ category: occurrences.category, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.category);

  // By severity
  const bySeverity = await db
    .select({ severity: occurrences.severity, total: count() })
    .from(occurrences)
    .where(whereClause)
    .groupBy(occurrences.severity);

  // Daily trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyTrend = await db
    .select({
      date: sql<string>`DATE(${occurrences.createdAt})`,
      total: count(),