# EcoMonitor IGEOAM — Plataforma de Monitoramento Ambiental Colaborativo

Aplicação web fullstack para que cidadãos relatem ocorrências ambientais (poluição, resíduos, desmatamento, degradação de geoglifos, etc.) com geolocalização, foto e áudio — e gestores acompanhem tudo num painel administrativo.

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Relato estilo WhatsApp** | Fluxo guiado em chat com bolhas, som e animações. Suporta texto, foto e áudio gravado. |
| **Gravação de áudio** | MediaRecorder API captura o blob `.ogg`; SpeechRecognition transcreve em pt-BR em tempo real. |
| **GPS automático** | `navigator.geolocation` com fallback para endereço manual. |
| **Armazenamento híbrido** | S3 (AWS, Cloudflare R2, MinIO…) quando configurado; disco local (`uploads/`) como fallback de desenvolvimento. |
| **Classificação por IA** | JSON `aiClassification` armazenado na BD com categoria, gravidade, confiança e raciocínio. |
| **Dashboard administrativo** | Estatísticas, gráficos, mapa interativo, filtros avançados e exportação CSV/PDF. |
| **Controle de acesso** | Roles `admin` / `user` via OAuth. Relatos anónimos também aceites. |

---

## Pilha Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 18.2 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Express | 4.18 |
| Upload | Multer (memória → S3 ou disco) | 2.1 |
| ORM | Drizzle ORM | 0.45 |
| Banco de Dados | MySQL (Laragon local / Railway prod) | 8+ |
| Storage nuvem | AWS S3 / Cloudflare R2 / MinIO | SDK v3 |
| Build | Vite | 5 |
| Runtime | Node.js | 20 |
| Deploy | Docker + Railway | — |

> **Nota:** O backend usa Express REST puro (`/api/occurrences`). Não há tRPC nesta versão.

---

## Estrutura de Diretórios

```
EcoMonitor-Urbano/
├── src/
│   └── pages/
│       ├── NewReport.tsx       # Interface de relato estilo WhatsApp
│       ├── Home.tsx            # Landing page
│       ├── MyReports.tsx       # Minhas ocorrências (cidadão)
│       ├── Dashboard.tsx       # Dashboard admin
│       ├── MapView.tsx         # Mapa interativo
│       ├── Occurrences.tsx     # Lista admin
│       └── Export.tsx          # Exportação CSV/PDF
├── server/
│   └── index.ts               # Servidor Express (porta 3001)
├── schema.ts                   # Schema Drizzle ORM (users + occurrences)
├── db.ts                       # Query helpers (createOccurrence, listOccurrences…)
├── migrate.ts                  # Executa migrations e termina (usado no start.sh)
├── llm.ts                      # Integração LLM para classificação IA
├── routers.ts                  # Routers tRPC (admin — dashboard, status, export)
├── drizzle/                    # Migrations geradas pelo Drizzle Kit
├── uploads/                    # Ficheiros locais (dev apenas — photos/ e audios/)
├── Dockerfile                  # Build multi-stage Node 20 Alpine
├── railway.toml                # Configuração Railway (builder + healthcheck)
├── start.sh                    # Entrypoint: migrate → server
└── vite.config.ts              # Proxy /api → localhost:3001 em dev
```

---

## Instalação (Desenvolvimento Local)

### Pré-requisitos

- Node.js 20+
- MySQL 8+ a correr (ex.: **Laragon** no Windows, ou `brew install mysql` no Mac)
- (Opcional) Conta S3 / Cloudflare R2 para armazenamento de media em produção

### Passos

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd EcoMonitor-Urbano

# 2. Instalar dependências (usa npm — há package-lock.json)
npm install

# 3. Criar o ficheiro de variáveis de ambiente
cp .env.example .env
# Editar .env com as suas credenciais (ver secção abaixo)

# 4. Criar a base de dados no MySQL
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ecomonitor;"

# 5. Aplicar o schema (cria/actualiza tabelas sem gerar ficheiros de migration)
npm run db:push

# 6. Iniciar o servidor Express (porta 3001)
npm run server

# 7. Em outro terminal, iniciar o frontend Vite (porta 5173)
npm run dev
```

A aplicação fica disponível em:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001/api/occurrences

O Vite está configurado para fazer proxy de `/api` para o servidor Express, por isso o frontend pode chamar `/api/occurrences` directamente.

---

## Configuração de Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projecto com as variáveis abaixo.

### Obrigatórias

```env
# Ligação ao MySQL
DATABASE_URL=mysql://root:@localhost:3306/ecomonitor
```

### Armazenamento de Media (S3 — opcional em dev, recomendado em produção)

Quando estas variáveis **não** estiverem definidas, o servidor guarda os ficheiros em `uploads/` no disco local e serve-os em `/uploads/*`.

```env
# Credenciais S3 (AWS, Cloudflare R2, MinIO, etc.)
S3_ACCESS_KEY=your-access-key-id
S3_SECRET_KEY=your-secret-access-key
S3_BUCKET=ecomonitor-media
S3_REGION=us-east-1

# (Opcional) Para R2/MinIO: endpoint personalizado
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com

# (Opcional) URL pública base para as media. Se omitido, usa o padrão AWS:
# https://<bucket>.s3.<region>.amazonaws.com
S3_PUBLIC_URL=https://cdn.example.com
```

### Funcionalidades Opcionais

```env
# Servidor Express (por defeito: 3001)
PORT=3001

# Chave JWT para sessões
JWT_SECRET=uma-chave-secreta-longa

# LLM para classificação automática de ocorrências
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
```

---

## Arquitectura de Media

```
Cidadão → FormData (foto + áudio) → POST /api/occurrences
                                          │
                                    server/index.ts
                                    (Multer memoryStorage)
                                          │
                          ┌─────────────┴─────────────┐
                   S3_* definidas?                     Não
                          │                             │
                    saveFile() → S3                 saveFile() → disco local
                    Devolve URL pública              Devolve /uploads/...
                          │                             │
                          └─────────────┬─────────────┘
                                        │
                              createOccurrence()
                              imageUrl → TEXT (MySQL)
                              audioUrl → TEXT (MySQL)
```

### Fluxo detalhado

1. O frontend envia `multipart/form-data` com os campos `photo` (File) e `audio` (Blob `.ogg`).
2. O Multer carrega tudo para memória (`memoryStorage`) — **sem tocar no disco ainda**.
3. `saveFile()` decide com base nas variáveis de ambiente:
   - **Com S3:** envia o buffer via `PutObjectCommand` e devolve a URL pública (`S3_PUBLIC_URL/<folder>/<filename>` ou padrão AWS).
   - **Sem S3:** escreve o buffer em `uploads/photos/` ou `uploads/audios/` e devolve `/uploads/<folder>/<filename>`.
4. As URLs são guardadas nas colunas `imageUrl` e `audioUrl` da tabela `occurrences`.
5. Em desenvolvimento, o Express serve `/uploads` como static. Em produção com S3, as URLs apontam directamente para o bucket.

### Schema da tabela `occurrences` (campos de media)

| Coluna | Tipo | Descrição |
|---|---|---|
| `imageUrl` | TEXT | URL da foto (S3 ou `/uploads/photos/…`) |
| `imageKey` | TEXT | Mantido por compatibilidade; pode ser nulo |
| `audioUrl` | TEXT | URL do áudio gravado (S3 ou `/uploads/audios/…`) |
| `aiClassification` | JSON | `{suggestedCategory, suggestedSeverity, confidence, reasoning, analyzedAt}` |

---

## Interface de Relato (WhatsApp UI)

O formulário de novo relato (`/report`) simula uma conversa de WhatsApp:

```
Passo 1 — location   : Cidadão envia GPS ou escreve endereço
Passo 2 — category   : Grid de 10 categorias (botões com emoji/ícone)
Passo 3 — description: Texto OU gravação de áudio OU foto directa
Passo 4 — photo      : Foto opcional (câmera ou galeria)
Passo 5 — severity   : Chips de gravidade (low / medium / high / critical)
Passo 6 — confirm    : Cartão resumo + botão de envio
Passo 7 — done       : Confirmação com ID do registo
```

**Gravação de áudio:**
- `MediaRecorder` captura o blob real (`.ogg; codecs=opus`).
- `SpeechRecognition` (Chrome/Edge/Safari) transcreve em tempo real — o texto transcrito torna-se a `description`.
- Se o browser não suportar transcrição, o blob de áudio é enviado na mesma e guardado como `audioUrl`.

---

## Deploy com Docker (Railway)

### Build e execução local via Docker

```bash
docker build -t ecomonitor .
docker run -p 3001:3001 \
  -e DATABASE_URL="mysql://user:pass@host:3306/ecomonitor" \
  -e S3_ACCESS_KEY="..." \
  -e S3_SECRET_KEY="..." \
  -e S3_BUCKET="ecomonitor-media" \
  ecomonitor
```

### Railway

O ficheiro `railway.toml` já está configurado:

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/occurrences"
healthcheckTimeout = 60
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Passos para deploy no Railway:**

1. Criar um novo projecto em [railway.app](https://railway.app) e ligar ao repositório GitHub.
2. Adicionar um serviço MySQL (Railway tem plugin MySQL nativo) ou apontar para um MySQL externo.
3. Definir as variáveis de ambiente na aba *Variables* do serviço (ver secção acima).
4. O Railway faz build do Dockerfile automaticamente.
5. O `start.sh` corre `migrate.ts` antes de arrancar o servidor — as tabelas são criadas/actualizadas automaticamente.

**O que acontece no arranque do container:**

```sh
#!/bin/sh
set -e
npx tsx migrate.ts        # aplica migrations pendentes → termina com exit(0)
exec npx tsx server/index.ts  # arranca o servidor Express
```

---

## Scripts npm

| Comando | Descrição |
|---|---|
| `npm run dev` | Frontend Vite (porta 5173) |
| `npm run server` | Servidor Express (porta 3001) |
| `npm run build` | Build frontend para `dist/` |
| `npm start` | Servidor em produção (NODE_ENV=production) |
| `npm run db:push` | Aplica schema ao MySQL sem gerar ficheiros |
| `npm run db:generate` | Gera ficheiros de migration |
| `npm run db:migrate` | Aplica ficheiros de migration |
| `npm run db:studio` | Drizzle Studio (GUI da BD) |
| `npm test` | Testes Vitest |

---

## Categorias de Ocorrência

| Valor | Label | Emoji |
|---|---|---|
| `geoglyph_degradation` | Degradação de Geoglifos | *(ícone SVG exclusivo IGEOAM)* |
| `deforestation` | Desmatamento | 🌳 |
| `air_pollution` | Poluição do Ar | 🌬️ |
| `water_pollution` | Poluição da Água | 💧 |
| `waste` | Resíduos | 🗑️ |
| `noise` | Poluição Sonora | 🔊 |
| `soil_contamination` | Contaminação do Solo | ⚗️ |
| `heat_island` | Queimadas | 🔥 |
| `flooding` | Alagamento | 🌊 |
| `other` | Outro | ❓ |

---

## Diagrama de Entidades (ER)

```
users
├── id (PK, autoincrement)
├── openId (UNIQUE)
├── name
├── email
├── loginMethod
├── role  ENUM('user','admin')  DEFAULT 'user'
├── createdAt
├── updatedAt
└── lastSignedIn

occurrences
├── id (PK, autoincrement)
├── userId (FK → users.id, nullable para relatos anónimos)
│
├── -- Localização --
├── latitude   FLOAT  NOT NULL
├── longitude  FLOAT  NOT NULL
├── address    TEXT
│
├── -- Classificação --
├── category   ENUM(10 categorias)  NOT NULL
├── description TEXT  NOT NULL
├── severity   ENUM('low','medium','high','critical')  DEFAULT 'medium'
├── status     ENUM('pending','in_analysis','resolved','rejected')  DEFAULT 'pending'
│
├── -- Media --
├── imageUrl   TEXT   (URL foto)
├── imageKey   TEXT   (compatibilidade)
├── audioUrl   TEXT   (URL áudio gravado)
│
├── -- IA --
├── aiClassification  JSON  {suggestedCategory, suggestedSeverity, confidence, reasoning, analyzedAt}
│
├── -- Repórter (anónimo possível) --
├── reporterName   TEXT
├── reporterEmail  VARCHAR(320)
│
├── createdAt
├── updatedAt
└── resolvedAt
```

---

## Suporte

- **Issues:** abrir issue no repositório GitHub
- **Logs (dev):** consola do terminal do servidor Express
- **Logs (prod):** Railway Dashboard → serviço → aba *Logs*

---

**Versão:** 1.1.0
**Última actualização:** Maio 2026
**Status:** Produção (Railway) + Desenvolvimento (Laragon)
