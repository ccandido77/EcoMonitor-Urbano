import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createOccurrence } from '../db';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Storage: S3 quando configurado, disco local como fallback ─────────────────

const useS3 = !!(
  process.env.S3_ACCESS_KEY &&
  process.env.S3_SECRET_KEY &&
  process.env.S3_BUCKET
);

const s3 = useS3
  ? new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    })
  : null;

// Cria pastas locais apenas quando não usa S3 (desenvolvimento)
const uploadDir = 'uploads/';
if (!useS3) {
  ['photos', 'audios'].forEach(sub => {
    const dir = path.join(uploadDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

// Multer sempre em memória — a decisão S3 vs disco acontece depois
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ── Helper: guarda o ficheiro e devolve a URL pública ─────────────────────────

async function saveFile(
  file: Express.Multer.File,
  folder: 'photos' | 'audios'
): Promise<string> {
  const ext =
    path.extname(file.originalname) ||
    (file.mimetype.startsWith('audio') ? '.ogg' : '.jpg');
  const filename = `${Date.now()}-${uuidv4()}${ext}`;

  if (useS3 && s3) {
    const key = `${folder}/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    // Suporta AWS S3 e endpoints compatíveis (Cloudflare R2, MinIO…)
    const base = process.env.S3_PUBLIC_URL
      ? process.env.S3_PUBLIC_URL
      : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION ?? 'us-east-1'}.amazonaws.com`;
    return `${base}/${key}`;
  }

  // Fallback: disco local
  const dest = path.join(uploadDir, folder, filename);
  fs.writeFileSync(dest, file.buffer);
  return `/uploads/${folder}/${filename}`;
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));

if (!useS3) {
  app.use('/uploads', express.static(uploadDir));
}

// ── POST /api/occurrences ─────────────────────────────────────────────────────

app.post(
  '/api/occurrences',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        address,
        category,
        description,
        severity,
        reporterName,
        reporterEmail,
        aiClassification,
      } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (latitude == null || longitude == null || !category || !description) {
        return res
          .status(400)
          .json({ error: 'Campos obrigatórios: latitude, longitude, category, description' });
      }

      const validCategories = [
        'air_pollution', 'water_pollution', 'waste', 'noise',
        'deforestation', 'soil_contamination', 'heat_island',
        'flooding', 'geoglyph_degradation', 'other',
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }

      const photoFile = files['photo']?.[0];
      const audioFile = files['audio']?.[0];

      const [photoUrl, audioUrl] = await Promise.all([
        photoFile ? saveFile(photoFile, 'photos') : Promise.resolve(null),
        audioFile ? saveFile(audioFile, 'audios') : Promise.resolve(null),
      ]);

      const data: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || null,
        category,
        description: String(description).slice(0, 2000),
        severity: severity ?? 'medium',
        status: 'pending',
        imageUrl: photoUrl,
        audioUrl,
        reporterName: reporterName ?? null,
        reporterEmail: reporterEmail ?? null,
        aiClassification: aiClassification ?? null,
      };

      const occurrence = await createOccurrence(data);
      res.status(201).json({ success: true, occurrence });
    } catch (err) {
      console.error('[POST /api/occurrences]', err);
      res.status(500).json({ error: 'Falha ao processar relato.' });
    }
  }
);

// ── GET /api/occurrences ──────────────────────────────────────────────────────

app.get('/api/occurrences', async (_req, res) => {
  try {
    const { listOccurrences } = await import('../db');
    const result = await listOccurrences({ limit: 20 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao listar ocorrências.' });
  }
});

// ── Frontend (produção) ───────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  const storage = useS3 ? `S3 (bucket: ${process.env.S3_BUCKET})` : 'disco local (uploads/)';
  console.log(`\n🌿 EcoMonitor Server: http://localhost:${PORT}`);
  console.log(`   Armazenamento: ${storage}`);
});
