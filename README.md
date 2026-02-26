# 🌿 EcoMonitor Urbano

Uma aplicação web completa que permite aos cidadãos registarem ocorrências ambientais e aos órgãos públicos monitorizarem indicadores em tempo real.

## 📊 Características Principais

### Módulo do Cidadão
- ✅ Interface simples para novo registo
- ✅ Upload de imagens
- ✅ Captura automática/manual de coordenadas GPS
- ✅ Categorização automática com IA
- ✅ Categorias: Resíduos Irregulares, Qualidade da Água, Ilhas de Calor, Queimadas, Áreas Verdes

### Módulo Administrativo
- ✅ Dashboard com estatísticas em tempo real
- ✅ Mapa interativo com ocorrências
- ✅ Filtros por data e tipo
- ✅ Exportação de relatórios (PDF/CSV)

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de Dados**: PostgreSQL + PostGIS
- **Mapas**: Leaflet (gratuito e poderoso)
- **IA**: Gemini API para classificação automática
- **Storage**: Cloudinary (ou local para prototipagem)

## 📁 Estrutura do Projeto

```
EcoMonitor-Urbano/
├── backend/              # API Node.js + Express
├── frontend/             # React + Vite
├── database/             # Scripts SQL e migrações
├── docs/                 # Documentação
└── README.md
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentação

- [Estrutura de Dados](./docs/DADOS.md)
- [API Reference](./docs/API.md)
- [Guia de Instalação](./docs/INSTALACAO.md)

## 👨‍💻 Autor

**ccandido77**

## 📄 Licença

MIT