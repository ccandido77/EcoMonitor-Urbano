import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { occurrences, users } from "../../schema";

const pool = mysql.createPool(process.env.DATABASE_URL!);
const db = drizzle(pool);

async function main() {
  console.log("🌱 A semear a base de dados...");

  // 1. Inserir utilizador admin (openId é o identificador único externo)
  await db
    .insert(users)
    .values({
      openId: "seed-admin-1",
      name: "Administrador EcoMonitor",
      email: "admin@ecomonitor.gov",
      role: "admin",
      loginMethod: "seed",
    })
    .onDuplicateKeyUpdate({ set: { name: "Administrador EcoMonitor" } });

  const admin = await db
    .select()
    .from(users)
    .where(eq(users.openId, "seed-admin-1"))
    .limit(1)
    .then((r) => r[0]);

  // 2. Inserir ocorrências de teste
  await db.insert(occurrences).values([
    {
      userId: admin.id,
      description:
        "Identificada movimentação de terra não autorizada em área de preservação arqueológica com geoglifos pré-colombianos.",
      category: "geoglyph_degradation",
      latitude: -9.974,
      longitude: -67.807,
      address: "Área de Preservação Arqueológica, Bujari - AC",
      status: "pending",
      severity: "high",
    },
    {
      userId: admin.id,
      description:
        "Zona comercial com temperatura 4°C acima da média periférica. Ausência de arborização e superfícies impermeáveis.",
      category: "heat_island",
      latitude: -9.95,
      longitude: -67.82,
      address: "Zona Comercial Central, Rio Branco - AC",
      status: "in_analysis",
      severity: "medium",
    },
    {
      userId: admin.id,
      description:
        "Acúmulo de entulho e plásticos na margem do igarapé, bloqueando parcialmente o escoamento natural.",
      category: "waste",
      latitude: -9.965,
      longitude: -67.815,
      address: "Margens do Igarapé São Francisco, Rio Branco - AC",
      status: "resolved",
      severity: "low",
      resolvedAt: new Date(),
    },
    {
      userId: admin.id,
      description:
        "Efluentes industriais detectados no curso d'água próximo à área industrial. Coloração anormal e odor forte.",
      category: "water_pollution",
      latitude: -9.98,
      longitude: -67.8,
      address: "Polo Industrial, Rio Branco - AC",
      status: "in_analysis",
      severity: "critical",
    },
    {
      userId: admin.id,
      description:
        "Área de floresta nativa com corte raso não licenciado estimado em 12 hectares.",
      category: "deforestation",
      latitude: -10.02,
      longitude: -67.75,
      address: "Ramal do Quixadá, Senador Guiomard - AC",
      status: "pending",
      severity: "high",
    },
  ]);

  console.log("✅ Seed concluído! Utilizador admin + 5 ocorrências inseridas.");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Erro ao semear:", err);
  process.exit(1);
});
