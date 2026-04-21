import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createOccurrence } from '../db';
import type { InsertOccurrence } from '../schema';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json({ limit: '10mb' }));

// ── POST /api/occurrences ───────────────────────────────────────────────────
app.post('/api/occurrences', async (req, res) => {
  const {
    latitude,
    longitude,
    address,
    category,
    description,
    severity,
    imageUrl,
    imageKey,
    reporterName,
    reporterEmail,
    aiClassification,
  } = req.body;

  if (latitude == null || longitude == null || !category || !description) {
    res.status(400).json({ error: 'Campos obrigatórios: latitude, longitude, category, description' });
    return;
  }

  const validCategories = [
    'air_pollution', 'water_pollution', 'waste', 'noise',
    'deforestation', 'soil_contamination', 'heat_island',
    'flooding', 'geoglyph_degradation', 'other',
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: 'Categoria inválida' });
    return;
  }

  try {
    const data: InsertOccurrence = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address ?? null,
      category,
      description: String(description).slice(0, 2000),
      severity: severity ?? 'medium',
      status: 'pending',
      imageUrl: imageUrl ?? null,
      imageKey: imageKey ?? null,
      reporterName: reporterName ?? null,
      reporterEmail: reporterEmail ?? null,
      aiClassification: aiClassification ?? null,
    };

    const occurrence = await createOccurrence(data);
    res.status(201).json({ success: true, occurrence });
  } catch (err) {
    console.error('[POST /api/occurrences]', err);
    res.status(500).json({ error: 'Falha ao registrar ocorrência. Verifique a conexão com o banco de dados.' });
  }
});

// ── GET /api/occurrences (lista simples para testes) ────────────────────────
app.get('/api/occurrences', async (_req, res) => {
  try {
    const { listOccurrences } = await import('../db');
    const result = await listOccurrences({ limit: 20 });
    res.json(result);
  } catch (err) {
    console.error('[GET /api/occurrences]', err);
    res.status(500).json({ error: 'Falha ao listar ocorrências.' });
  }
});

// ── Serve Vite build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🌿 EcoMonitor Server: http://localhost:${PORT}`);
  console.log(`   Banco de dados: ${process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@') ?? 'não configurado'}`);
});
