import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  createOccurrence: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    latitude: -23.5505,
    longitude: -46.6333,
    address: "São Paulo, SP",
    category: "waste",
    description: "Lixo irregular acumulado na calçada",
    severity: "medium",
    status: "pending",
    imageUrl: null,
    imageKey: null,
    aiClassification: null,
    reporterName: null,
    reporterEmail: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    resolvedAt: null,
  }),
  listOccurrences: vi.fn().mockResolvedValue({
    items: [
      {
        id: 1,
        category: "waste",
        description: "Lixo irregular",
        severity: "medium",
        status: "pending",
        latitude: -23.5505,
        longitude: -46.6333,
        address: "São Paulo, SP",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        resolvedAt: null,
        userId: 1,
        imageUrl: null,
        imageKey: null,
        aiClassification: null,
        reporterName: null,
        reporterEmail: null,
        userName: "Test User",
      },
    ],
    total: 1,
  }),
  getOccurrenceById: vi.fn().mockResolvedValue({
    id: 1,
    category: "waste",
    description: "Lixo irregular",
    severity: "medium",
    status: "pending",
    latitude: -23.5505,
    longitude: -46.6333,
    address: "São Paulo, SP",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    resolvedAt: null,
    userId: 1,
    imageUrl: null,
    imageKey: null,
    aiClassification: null,
    reporterName: null,
    reporterEmail: null,
    userName: "Test User",
  }),
  getOccurrenceStats: vi.fn().mockResolvedValue({
    total: 5,
    byStatus: [{ status: "pending", total: 3 }, { status: "resolved", total: 2 }],
    byCategory: [{ category: "waste", total: 3 }, { category: "water_pollution", total: 2 }],
    bySeverity: [{ severity: "medium", total: 4 }, { severity: "high", total: 1 }],
    dailyTrend: [{ date: "2025-01-01", total: 2 }, { date: "2025-01-02", total: 3 }],
  }),
  updateOccurrenceStatus: vi.fn().mockResolvedValue(undefined),
  getAllOccurrencesForExport: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            suggestedCategory: "waste",
            suggestedSeverity: "medium",
            confidence: 0.9,
            reasoning: "A descrição menciona lixo irregular.",
          }),
        },
      },
    ],
  }),
}));

// ─── Mock Storage ─────────────────────────────────────────────────────────────

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test/test.jpg" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-1",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("occurrences.create", () => {
  it("creates an occurrence as a public user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.occurrences.create({
      latitude: -23.5505,
      longitude: -46.6333,
      category: "waste",
      description: "Lixo irregular acumulado na calçada",
      severity: "medium",
    });
    expect(result.id).toBe(1);
    expect(result.category).toBe("waste");
    expect(result.status).toBe("pending");
  });
});

describe("occurrences.list", () => {
  it("lists occurrences with default pagination", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.occurrences.list({ limit: 50, offset: 0 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe("waste");
  });
});

describe("occurrences.getById", () => {
  it("returns a single occurrence by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.occurrences.getById({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.description).toBe("Lixo irregular");
  });
});

describe("occurrences.stats", () => {
  it("returns aggregated statistics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.occurrences.stats({});
    expect(result.total).toBe(5);
    expect(result.byStatus).toHaveLength(2);
    expect(result.byCategory).toHaveLength(2);
    expect(result.dailyTrend).toHaveLength(2);
  });
});

describe("occurrences.classify", () => {
  it("classifies an occurrence using AI", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.occurrences.classify({
      description: "Lixo irregular acumulado na calçada",
    });
    expect(result.suggestedCategory).toBe("waste");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.reasoning).toBeTruthy();
  });
});

describe("occurrences.updateStatus", () => {
  it("allows admin to update occurrence status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.occurrences.updateStatus({ id: 1, status: "resolved" });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users from updating status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.occurrences.updateStatus({ id: 1, status: "resolved" })
    ).rejects.toThrow();
  });
});

describe("occurrences.exportCsv", () => {
  it("allows admin to export CSV", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.occurrences.exportCsv({});
    expect(result.csv).toBeTruthy();
    expect(typeof result.total).toBe("number");
  });

  it("rejects non-admin users from exporting", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.occurrences.exportCsv({})).rejects.toThrow();
  });
});
