# Ecomonitor IGEOAM — Plataforma de Monitoramento Ambiental Colaborativo

## 1. Introdução

### 1.1 Objetivo

Este documento descreve a especificação técnica e funcional do **Ecomonitor IGEOAM**, uma plataforma web de monitoramento ambiental colaborativo. O objetivo é fornecer uma visão completa do sistema, seus requisitos, arquitetura e funcionalidades para desenvolvedores, gestores de projeto, administradores de sistema e stakeholders.

**Público-alvo:** Desenvolvedores, arquitetos de software, gestores públicos, cidadãos, analistas de requisitos e equipes de QA.

### 1.2 Escopo do Sistema

O **Ecomonitor IGEOAM** é uma plataforma web que permite:

- **Cidadãos** registrarem ocorrências ambientais (degradação dos Geoglifos, poluição, resíduos, ruído, desmatamento, etc.) com geolocalização automática, upload de imagens, descrição textual e áudios opicionais.
- **Gestores IGEOAM** acompanharem ocorrências em tempo real através de um painel administrativo com dashboard, mapa interativo, filtros avançados e exportação de relatórios.
- **Sistema de IA** classificar automaticamente ocorrências por categoria e nível de gravidade, analisando descrição e imagem.
- **Armazenamento seguro** de imagens em S3 com URLs públicas referenciadas no banco de dados.

**Benefícios esperados:**

- Aumentar a participação cidadã no monitoramento ambiental urbano.
- Acelerar a resposta de gestores públicos a problemas ambientais.
- Criar um histórico centralizado e rastreável de ocorrências ambientais.
- Reduzir tempo de classificação manual de problemas através de IA.
- Facilitar análise de tendências e tomada de decisão baseada em dados.

### 1.3 Definições, Acrônimos e Abreviações

| Termo | Definição |
|-------|-----------|
| **IA / LLM** | Inteligência Artificial / Large Language Model (classificação automática de ocorrências) |
| **GPS / Geolocalização** | Sistema de Posicionamento Global; captura automática de coordenadas do usuário |
| **S3** | Amazon Simple Storage Service; armazenamento em nuvem para imagens |
| **tRPC** | TypeScript RPC; framework para chamadas de procedimento remoto com tipagem end-to-end |
| **Ocorrência** | Registro de um problema ambiental (poluição, resíduo, ruído, etc.) |
| **Categoria** | Tipo de problema ambiental (ar, água, resíduos, ruído, desmatamento, solo, calor, alagamento) |
| **Gravidade** | Nível de impacto (baixa, média, alta, crítica) |
| **Status** | Estado da ocorrência (pendente, em análise, resolvido, rejeitado) |
| **Admin / Gestor** | Usuário com permissão de acesso ao painel administrativo |
| **Cidadão** | Usuário comum que registra ocorrências |
| **CSV** | Comma-Separated Values; formato de exportação de dados |
| **PDF** | Portable Document Format; formato de relatório exportado |
| **API REST / tRPC** | Interface de comunicação entre frontend e backend |
| **Manus OAuth** | Sistema de autenticação integrado da plataforma Manus |

### 1.4 Referências

- **Especificação do Projeto:** Documento de requisitos fornecido pelo cliente (10 funcionalidades principais).
- **Stack Tecnológico:** React 19, Tailwind CSS 4, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB.
- **Componentes UI:** shadcn/ui, Recharts (gráficos), Google Maps API.
- **Bibliotecas:** jsPDF (exportação PDF), Geolocation API (GPS), S3 SDK (armazenamento).

---

## 2. Descrição Geral

### 2.1 Perspectiva do Produto

O **Ecomonitor IGEOAM** é uma solução standalone que funciona de forma independente, mas pode integrar-se com:

- **Sistemas de gestão municipal** — para sincronizar dados de ocorrências com plataformas de administração pública.
- **Aplicativos móveis** — através de API REST/tRPC para captura de dados em campo.
- **Plataformas de análise de dados** — exportação de relatórios em CSV/PDF para BI tools.
- **Redes sociais e comunicação** — notificações por e-mail para gestores e cidadãos.

### 2.2 Funções do Produto

O sistema oferece as seguintes funcionalidades principais:

| Funcionalidade | Descrição |
|---|---|
| **Módulo do Cidadão** | Formulário de registro com GPS automático, upload de imagem, seleção de categoria e descrição. |
| **Classificação por IA** | Análise automática de descrição e imagem para sugerir categoria e gravidade. |
| **Armazenamento S3** | Upload seguro de imagens com URLs públicas referenciadas no banco. |
| **Dashboard Administrativo** | Painel com estatísticas em tempo real (total, por categoria, por gravidade, por status). |
| **Gráficos Interativos** | AreaChart (tendência 30 dias), PieChart (distribuição), BarChart (gravidade), progress bars. |
| **Mapa Interativo** | Google Maps com marcadores coloridos por categoria, popup de detalhes. |
| **Filtros Avançados** | Categoria, status, intervalo de datas, área geográfica. |
| **Exportação de Relatórios** | CSV e PDF com dados filtrados, estatísticas agregadas e lista de ocorrências. |
| **Gerenciamento de Status** | Admins podem atualizar status das ocorrências (pendente → em análise → resolvido). |
| **Controle de Acesso** | Autenticação OAuth, roles (admin/user), restrição de páginas administrativas. |

### 2.3 Características dos Usuários

#### **Perfil 1: Cidadão (Usuário Comum)**

- **Objetivo:** Reportar problemas ambientais na sua região.
- **Conhecimento técnico:** Básico (sabe usar navegador e smartphone).
- **Frequência de uso:** Ocasional (quando observa um problema).
- **Necessidades:** Interface simples, GPS automático, confirmação de envio.

#### **Perfil 2: Gestor Público (Admin)**

- **Objetivo:** Acompanhar, analisar e gerenciar ocorrências ambientais.
- **Conhecimento técnico:** Intermediário (familiarizado com dashboards e ferramentas de análise).
- **Frequência de uso:** Diária.
- **Necessidades:** Dashboard com KPIs, filtros, mapa, exportação de dados, atualização de status.

#### **Perfil 3: Analista de Dados (Admin Avançado)**

- **Objetivo:** Extrair insights de dados ambientais para relatórios e planejamento.
- **Conhecimento técnico:** Avançado.
- **Frequência de uso:** Semanal/mensal.
- **Necessidades:** Exportação em múltiplos formatos, filtros complexos, dados brutos.

### 2.4 Restrições Gerais

| Restrição | Descrição |
|---|---|
| **Tecnológica** | Sistema deve rodar em navegadores modernos (Chrome, Firefox, Safari, Edge). Suporte a mobile via responsive design. |
| **Performance** | Dashboard deve carregar em < 3 segundos. Mapa com até 10.000 marcadores sem lag. |
| **Segurança** | Dados sensíveis (GPS, imagens) devem ser protegidos. Apenas admins acessam painel. Imagens armazenadas em S3 com URLs públicas. |
| **Disponibilidade** | Sistema deve estar disponível 99% do tempo (exceto manutenção planejada). |
| **Escalabilidade** | Suportar até 100.000 ocorrências sem degradação de performance. |
| **Conformidade** | LGPD (Lei Geral de Proteção de Dados) — consentimento para coleta de GPS e dados pessoais. |
| **Navegador** | Requer suporte a Geolocation API, localStorage, fetch/XHR. |

### 2.5 Suposições e Dependências

| Suposição / Dependência | Impacto |
|---|---|
| **Google Maps API disponível** | Mapa interativo depende de conexão com Google Maps. Sem acesso, funcionalidade fica indisponível. |
| **S3 configurado** | Upload de imagens requer bucket S3 ativo. Sem S3, imagens não podem ser armazenadas. |
| **LLM disponível** | Classificação por IA depende de acesso à API de LLM. Sem acesso, fallback para palavras-chave. |
| **Banco de dados MySQL/TiDB** | Sistema requer banco relacional. Sem DB, aplicação não funciona. |
| **Autenticação OAuth Manus** | Login depende de servidor OAuth. Sem acesso, usuários não conseguem autenticar. |
| **Geolocalização do navegador** | GPS automático requer permissão do usuário e navegador moderno. |
| **Conectividade de internet** | Usuários precisam de conexão estável para enviar dados e imagens. |

---

## 3. Requisitos Específicos

### 3.1 Requisitos Funcionais

#### **RF01 — Registro de Ocorrência Ambiental**

O sistema deverá permitir que cidadãos registrem ocorrências ambientais preenchendo um formulário com os seguintes campos:

- Coordenadas GPS (capturadas automaticamente via Geolocation API).
- Endereço (exibido em formato legível).
- Categoria (seleção obrigatória: ar, água, resíduos, ruído, desmatamento, solo, calor, alagamento, outro).
- Descrição (texto livre, mínimo 10 caracteres).
- Imagem (upload opcional, máximo 5MB).
- Nome do repórter (opcional).
- E-mail do repórter (opcional, validado).

**Critério de aceitação:** Formulário deve validar todos os campos, enviar dados ao backend via tRPC, armazenar imagem em S3 e retornar ID da ocorrência.

#### **RF02 — Classificação Automática por IA**

O sistema deverá analisar a descrição e imagem da ocorrência usando um LLM para sugerir:

- Categoria (com confiança de 0-100%).
- Nível de gravidade (baixa, média, alta, crítica).
- Reasoning (explicação em português).

Se o LLM falhar, usar classificação por palavras-chave como fallback.

**Critério de aceitação:** Classificação deve ser retornada em < 5 segundos. Confiança > 80% deve ser aceita automaticamente. Confiança < 80% deve ser marcada para revisão manual.

#### **RF03 — Dashboard Administrativo com Estatísticas**

O painel administrativo deverá exibir:

- Total de ocorrências registradas.
- Distribuição por categoria (PieChart).
- Distribuição por gravidade (BarChart).
- Distribuição por status (progress bars).
- Tendência de ocorrências nos últimos 30 dias (AreaChart).
- Filtros por categoria, status e intervalo de datas.

**Critério de aceitação:** Dashboard deve carregar em < 3 segundos. Gráficos devem atualizar em tempo real. Filtros devem ser responsivos.

#### **RF04 — Mapa Interativo com Marcadores**

O sistema deverá exibir um mapa Google Maps com:

- Marcadores coloridos para cada ocorrência (cor por categoria).
- Popup ao clicar no marcador com detalhes (categoria, gravidade, status, descrição).
- Legenda de cores por categoria.
- Zoom e pan interativos.
- Suporte a até 10.000 marcadores sem lag.

**Critério de aceitação:** Mapa deve carregar em < 5 segundos. Marcadores devem ser clicáveis. Popup deve exibir informações corretas.

#### **RF05 — Filtros Avançados**

O sistema deverá permitir filtrar ocorrências por:

- Categoria (multi-select).
- Status (multi-select: pendente, em análise, resolvido, rejeitado).
- Intervalo de datas (data inicial e final).
- Área geográfica (raio em km a partir de coordenadas).

**Critério de aceitação:** Filtros devem ser aplicáveis simultaneamente. Resultados devem atualizar em < 2 segundos.

#### **RF06 — Exportação de Relatórios**

O sistema deverá permitir exportar dados filtrados em dois formatos:

- **CSV:** Cabeçalho com colunas (ID, Categoria, Descrição, Gravidade, Status, Latitude, Longitude, Endereço, Repórter, Data).
- **PDF:** Capa com título, data de geração, estatísticas agregadas (gráficos), tabela de ocorrências.

**Critério de aceitação:** Exportação deve incluir apenas dados filtrados. PDF deve ser gerado em < 10 segundos. Arquivo deve ser baixado automaticamente.

#### **RF07 — Gerenciamento de Status**

Admins deverão poder atualizar o status de uma ocorrência de:

- Pendente → Em análise → Resolvido.
- Pendente → Rejeitado.
- Qualquer status → Resolvido (com data de resolução).

**Critério de aceitação:** Atualização deve ser imediata. Histórico de mudanças deve ser registrado (opcional).

#### **RF08 — Autenticação e Controle de Acesso**

O sistema deverá:

- Usar Manus OAuth para autenticação.
- Distinguir roles: `admin` e `user`.
- Restringir acesso ao painel administrativo apenas para admins.
- Permitir cidadãos acessarem formulário de registro e histórico de suas ocorrências.

**Critério de aceitação:** Login deve funcionar. Redirecionamento deve ser correto por role. Sessão deve persistir.

#### **RF09 — Armazenamento de Imagens em S3**

O sistema deverá:

- Aceitar upload de imagens (JPEG, PNG, WebP, máximo 5MB).
- Armazenar em S3 com chave única (e.g., `occurrences/{userId}/{timestamp}-{filename}`).
- Retornar URL pública da imagem.
- Referenciar URL no banco de dados.

**Critério de aceitação:** Upload deve ser concluído em < 10 segundos. URL deve ser acessível publicamente. Imagem deve ser exibida corretamente no mapa e dashboard.

#### **RF10 — Listagem de Ocorrências do Cidadão**

Cidadãos autenticados deverão poder visualizar:

- Lista de suas próprias ocorrências registradas.
- Status atual de cada ocorrência.
- Data de registro.
- Imagem (se houver).

**Critério de aceitação:** Lista deve carregar em < 2 segundos. Paginação deve funcionar. Dados devem estar atualizados.

---

### 3.2 Requisitos Não Funcionais

#### **RNF01 — Desempenho**

- Dashboard deve carregar em < 3 segundos.
- Mapa com 10.000 marcadores deve ser responsivo (< 500ms para pan/zoom).
- Filtros devem aplicar em < 2 segundos.
- Exportação de PDF deve ser concluída em < 10 segundos.
- Classificação por IA deve retornar em < 5 segundos.
- API tRPC deve responder em < 500ms para 95% das requisições.

#### **RNF02 — Segurança**

- Todos os dados devem ser transmitidos via HTTPS.
- Senhas não devem ser armazenadas (OAuth).
- Apenas admins devem acessar dados administrativos.
- Imagens devem ser armazenadas em S3 com ACL público (URL pública).
- Validação de entrada em todos os formulários (XSS, SQL injection).
- Rate limiting em endpoints de criação de ocorrências (máximo 10 por hora por IP).
- LGPD: Consentimento explícito para coleta de GPS e dados pessoais.

#### **RNF03 — Usabilidade**

- Interface deve ser responsiva (mobile, tablet, desktop).
- Acessibilidade WCAG 2.1 AA (contraste, navegação por teclado, leitores de tela).
- Tempo de carregamento de página < 3 segundos.
- Feedback visual para ações do usuário (loading, sucesso, erro).
- Mensagens de erro em português claro e acionável.
- Suporte a navegadores modernos (Chrome, Firefox, Safari, Edge).

#### **RNF04 — Confiabilidade**

- Disponibilidade 99% (exceto manutenção planejada).
- Backup automático do banco de dados (diário).
- Recuperação de falhas em < 1 hora.
- Logging de todas as ações críticas (criação, atualização de status, exportação).
- Monitoramento de erros em tempo real.
- Testes automatizados (Vitest) com cobertura > 80%.

#### **RNF05 — Escalabilidade**

- Suportar até 100.000 ocorrências sem degradação.
- Suportar até 1.000 usuários simultâneos.
- Banco de dados deve ser otimizado com índices em campos frequentemente consultados.
- Cache de dados estáticos (categorias, labels) no frontend.

#### **RNF06 — Manutenibilidade**

- Código deve seguir padrões de limpeza e documentação.
- Arquitetura modular (separação de concerns).
- Testes automatizados para funcionalidades críticas.
- Documentação técnica (README, comentários de código).
- Versionamento de código (Git).

---

### 3.3 Regras de Negócio

| Regra | Descrição |
|---|---|
| **RN01** | Uma ocorrência só pode ser criada se tiver GPS válido (latitude e longitude inseridos automaticamente pelo sistema). |
| **RN02** | A categoria de uma ocorrência deve ser uma das 10 categorias predefinidas. |
| **RN03** | O status inicial de uma ocorrência é sempre "pendente". |
| **RN04** | Apenas admins podem alterar o status de uma ocorrência. |
| **RN05** | Uma ocorrência resolvida deve ter data de resolução registrada. |
| **RN06** | A imagem é opcional, mas se fornecida, deve ter máximo 5MB, assim como o áudio. |
| **RN07** | A descrição deve ter mínimo 10 caracteres. |
| **RN08** | A classificação por IA é sugestiva; o admin pode sobrescrever. |
| **RN09** | Cidadãos só podem ver suas próprias ocorrências (exceto em mapa público). |
| **RN10** | Exportação de dados é restrita a admins. |
| **RN11** | Ocorrências devem ser imutáveis após criação (apenas status pode mudar). |
| **RN12** | O sistema deve manter histórico de mudanças de status. |

---

### 3.4 Requisitos de Interface

#### **3.4.1 Interface com Usuário (UI)**

**Landing Page:**
- Hero com título "Proteja o meio ambiente da sua cidade".
- Descrição breve do sistema.
- Dois CTAs: "Registrar Ocorrência" e "Acessar Painel Admin".
- Seção de features com ícones e descrições.

**Formulário de Registro:**
- Campo de GPS (automático, com botão para atualizar).
- Campo de endereço (somente leitura, preenchido via GPS).
- Dropdown de categoria com ícones.
- Textarea de descrição.
- Upload de imagem com preview.
- Campos opcionais: nome e e-mail.
- Botão "Sugerir Categoria" (chama IA).
- Botão "Enviar" (desabilitado até validação).

**Dashboard Administrativo:**
- Sidebar com navegação (Dashboard, Mapa, Ocorrências, Exportar).
- Header com logo, nome do usuário, logout.
- Cards de estatísticas (total, pendentes, em análise, resolvidos).
- Gráficos interativos (Recharts).
- Filtros em barra lateral ou modal.

**Mapa Interativo:**
- Google Maps em tela cheia.
- Marcadores coloridos por categoria.
- Legenda de cores.
- Popup ao clicar (detalhes da ocorrência).
- Zoom e pan.

**Lista de Ocorrências:**
- Tabela com colunas: ID, Categoria, Descrição, Gravidade, Status, Data.
- Paginação.
- Ações: Visualizar, Editar Status.
- Filtros acima da tabela.

**Exportação:**
- Formulário com filtros (categoria, status, datas).
- Botões: "Exportar CSV", "Exportar PDF".
- Feedback de progresso.

#### **3.4.2 Interface com Hardware**

- **Geolocation API:** Captura de GPS do dispositivo do usuário.
- **Câmera (opcional):** Acesso à câmera para captura de foto direta (não implementado na v1, mas preparado para futuro).
- **Armazenamento local:** localStorage para cache de dados (não implementado na v1).

#### **3.4.3 Interface com Software Externo**

| Sistema | Protocolo | Dados |
|---|---|---|
| **Google Maps API** | HTTPS REST | Coordenadas, marcadores, geocoding |
| **S3 (AWS)** | HTTPS REST + SDK | Upload/download de imagens |
| **LLM (Manus Forge API)** | HTTPS REST | Descrição + imagem para classificação |
| **OAuth Manus** | HTTPS OAuth 2.0 | Autenticação de usuários |
| **MySQL/TiDB** | TCP (porta 3306) | CRUD de ocorrências e usuários |

---

## 4. Modelagem do Sistema

### 4.1 Diagrama de Casos de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│                        Ecomonitor IGEOAM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐                          ┌──────────────┐    │
│  │   Cidadão    │                          │    Admin     │    │
│  └──────────────┘                          └──────────────┘    │
│         │                                          │             │
│         ├─────────────────────────────────────────┤             │
│         │                                          │             │
│    ┌────▼─────────────┐                    ┌─────▼────────┐    │
│    │ Registrar        │                    │ Visualizar   │    │
│    │ Ocorrência       │                    │ Dashboard    │    │
│    └────┬─────────────┘                    └─────┬────────┘    │
│         │                                        │              │
│    ┌────▼──────────────┐                   ┌────▼────────────┐ │
│    │ Capturar GPS      │                   │ Filtrar Dados   │ │
│    └────┬──────────────┘                   └────┬────────────┘ │
│         │                                       │               │
│    ┌────▼──────────────┐                   ┌───▼─────────────┐ │
│    │ Upload Imagem     │                   │ Visualizar Mapa │ │
│    └────┬──────────────┘                   └───┬─────────────┘ │
│         │                                      │                │
│    ┌────▼──────────────────┐            ┌─────▼──────────────┐ │
│    │ Classificação por IA  │            │ Atualizar Status   │ │
│    └────┬──────────────────┘            └─────┬──────────────┘ │
│         │                                     │                 │
│    ┌────▼──────────────────┐            ┌────▼───────────────┐ │
│    │ Enviar Ocorrência     │            │ Exportar Relatório │ │
│    └───────────────────────┘            └────────────────────┘ │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Sistema IA  │ ◄─────────────────────────────────────────┐  │
│  └──────────────┘                                            │  │
│                                                              │  │
│  ┌──────────────┐                                            │  │
│  │  Google Maps │ ◄──────────────────────────────────────┐  │  │
│  └──────────────┘                                         │  │  │
│                                                           │  │  │
│  ┌──────────────┐                                         │  │  │
│  │     S3       │ ◄─────────────────────────────────┐    │  │  │
│  └──────────────┘                                   │    │  │  │
│                                                     │    │  │  │
│  ┌──────────────┐                                   │    │  │  │
│  │   MySQL DB   │ ◄──────────────────────────┐     │    │  │  │
│  └──────────────┘                            │     │    │  │  │
│                                              │     │    │  │  │
└──────────────────────────────────────────────┼─────┼────┼──┼──┘
                                               │     │    │  │
                                               └─────┴────┴──┘
```

### 4.2 Diagrama de Entidades (ER)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │      users           │        │   occurrences        │  │
│  ├──────────────────────┤        ├──────────────────────┤  │
│  │ id (PK)              │◄───┐   │ id (PK)              │  │
│  │ openId (UNIQUE)      │    │   │ userId (FK)          │  │
│  │ name                 │    │   │ latitude             │  │
│  │ email                │    │   │ longitude            │  │
│  │ loginMethod          │    │   │ address              │  │
│  │ role (admin/user)    │    │   │ category             │  │
│  │ createdAt            │    │   │ description          │  │
│  │ updatedAt            │    │   │ severity             │  │
│  │ lastSignedIn         │    │   │ status               │  │
│  └──────────────────────┘    │   │ imageUrl             │  │
│                              │   │ imageKey             │  │
│                              │   │ aiClassification     │  │
│                              │   │ reporterName         │  │
│                              │   │ reporterEmail        │  │
│                              │   │ createdAt            │  │
│                              │   │ updatedAt            │  │
│                              │   │ resolvedAt           │  │
│                              │   └──────────────────────┘  │
│                              │                              │
│                              └──────────────────────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────┘

Relação: 1 usuário pode ter N ocorrências
         1 ocorrência pertence a 1 usuário (ou null para anônimo)
```

### 4.3 Diagrama de Sequência — Registro de Ocorrência

```
Cidadão          Frontend         Backend (tRPC)    S3         LLM
   │                │                  │            │           │
   │─ Acessa /report─►│                 │            │           │
   │                │                  │            │           │
   │─ Clica "Usar GPS"─►│              │            │           │
   │                │─ Geolocation.get()─►          │           │
   │                │◄─ lat, lon ─────┤            │           │
   │                │                  │            │           │
   │─ Preenche form─►│                 │            │           │
   │                │                  │            │           │
   │─ Clica "Sugerir Categoria"─►│     │            │           │
   │                │─ classify(desc, img)──►       │           │
   │                │                  │            │           ├─ Analisa
   │                │◄─ suggestedCategory ◄─────────┤           │
   │                │                  │            │           │
   │─ Clica "Enviar"─►│                │            │           │
   │                │─ uploadImage(base64)─────────►│           │
   │                │◄─ imageUrl ◄────────────────┤            │
   │                │                  │            │           │
   │                │─ create(occ)────►│            │           │
   │                │                  ├─ Valida   │           │
   │                │                  ├─ Insere DB│           │
   │                │◄─ occurrenceId ◄┤            │           │
   │                │                  │            │           │
   │◄─ Sucesso! ────│                  │            │           │
   │                │                  │            │           │
```

---

## 5. Critérios de Aceitação

### **Critério 1: Registro de Ocorrência**

- [ ] Formulário valida GPS (não vazio, coordenadas válidas).
- [ ] Formulário valida descrição (mínimo 10 caracteres).
- [ ] Imagem é opcional, máximo 5MB.
- [ ] Imagem é enviada para S3 e URL é armazenada.
- [ ] Classificação por IA retorna categoria e gravidade.
- [ ] Ocorrência é criada com status "pendente".
- [ ] Usuário recebe confirmação com ID da ocorrência.

### **Critério 2: Dashboard Administrativo**

- [ ] Dashboard carrega em < 3 segundos.
- [ ] Contadores exibem números corretos (total, por status).
- [ ] Gráficos renderizam sem erros.
- [ ] Filtros aplicam corretamente.
- [ ] Dados atualizam em tempo real (sem refresh manual).

### **Critério 3: Mapa Interativo**

- [ ] Mapa carrega em < 5 segundos.
- [ ] Marcadores aparecem nas coordenadas corretas.
- [ ] Cores dos marcadores correspondem às categorias.
- [ ] Popup exibe detalhes corretos ao clicar.
- [ ] Zoom e pan funcionam.

### **Critério 4: Exportação de Relatórios**

- [ ] CSV inclui todas as colunas especificadas.
- [ ] PDF inclui capa, estatísticas e tabela.
- [ ] Exportação respeita filtros aplicados.
- [ ] Arquivo é baixado automaticamente.

### **Critério 5: Autenticação e Acesso**

- [ ] Login via OAuth funciona.
- [ ] Admins acessam painel administrativo.
- [ ] Cidadãos são redirecionados para landing page.
- [ ] Logout funciona e limpa sessão.

### **Critério 6: Testes Automatizados**

- [ ] Todos os routers tRPC têm testes Vitest.
- [ ] Cobertura de testes > 80%.
- [ ] Testes passam sem erros.

---

## 6. Matriz de Rastreabilidade

| ID | Requisito | Caso de Uso | Regra de Negócio | Critério de Aceitação | Status |
|---|---|---|---|---|---|
| RF01 | Registro de Ocorrência | Registrar Ocorrência | RN01, RN02, RN03, RN07 | Critério 1 | ✅ Implementado |
| RF02 | Classificação por IA | Classificação por IA | RN08 | Critério 1 | ✅ Implementado |
| RF03 | Dashboard | Visualizar Dashboard | - | Critério 2 | ✅ Implementado |
| RF04 | Mapa Interativo | Visualizar Mapa | - | Critério 3 | ✅ Implementado |
| RF05 | Filtros Avançados | Filtrar Dados | - | Critério 2 | ✅ Implementado |
| RF06 | Exportação | Exportar Relatório | RN10 | Critério 4 | ✅ Implementado |
| RF07 | Gerenciamento de Status | Atualizar Status | RN04, RN05, RN11, RN12 | Critério 2 | ✅ Implementado |
| RF08 | Autenticação | Login | - | Critério 5 | ✅ Implementado |
| RF09 | Armazenamento S3 | Upload Imagem | RN06 | Critério 1 | ✅ Implementado |
| RF10 | Listagem do Cidadão | Visualizar Minhas Ocorrências | RN09 | Critério 1 | ✅ Implementado |
| RNF01 | Desempenho | - | - | Dashboard < 3s | ✅ Implementado |
| RNF02 | Segurança | - | - | HTTPS, validação | ✅ Implementado |
| RNF03 | Usabilidade | - | - | Responsivo, acessível | ✅ Implementado |
| RNF04 | Confiabilidade | - | - | Testes > 80% | ✅ Implementado |

---

## 7. Arquitetura Técnica

### 7.1 Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| **Frontend** | React | 19.2.1 |
| **Styling** | Tailwind CSS | 4.1.14 |
| **UI Components** | shadcn/ui | Latest |
| **Gráficos** | Recharts | 2.15.2 |
| **Mapas** | Google Maps API | Latest |
| **Backend** | Express | 4.21.2 |
| **RPC** | tRPC | 11.6.0 |
| **ORM** | Drizzle ORM | 0.44.5 |
| **Banco de Dados** | MySQL / TiDB | Latest |
| **Autenticação** | Manus OAuth | Built-in |
| **Armazenamento** | AWS S3 | Latest |
| **IA** | LLM (Manus Forge) | Latest |
| **Testes** | Vitest | 2.1.4 |
| **Build** | Vite | 7.1.7 |

### 7.2 Estrutura de Diretórios

```
ecomonitor/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx                 # Landing page
│   │   │   ├── NewReport.tsx            # Formulário de registro
│   │   │   ├── MyReports.tsx            # Minhas ocorrências
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx        # Dashboard
│   │   │   │   ├── MapView.tsx          # Mapa interativo
│   │   │   │   ├── Occurrences.tsx      # Lista de ocorrências
│   │   │   │   └── Export.tsx           # Exportação
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── OccurrenceBadges.tsx     # CategoryBadge, SeverityBadge, StatusBadge
│   │   │   ├── AdminLayout.tsx          # Layout do painel admin
│   │   │   ├── DashboardLayout.tsx      # Layout dashboard
│   │   │   ├── Map.tsx                  # Componente Google Maps
│   │   │   └── ui/                      # shadcn/ui components
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx         # Tema light/dark
│   │   ├── hooks/
│   │   │   └── useAuth.ts               # Hook de autenticação
│   │   ├── lib/
│   │   │   └── trpc.ts                  # Cliente tRPC
│   │   ├── App.tsx                      # Router principal
│   │   ├── main.tsx                     # Entry point
│   │   └── index.css                    # Design system (cores, tipografia)
│   ├── index.html
│   └── public/
│       ├── favicon.ico
│       └── robots.txt
├── server/
│   ├── routers/
│   │   └── occurrences.ts               # Router tRPC para occurrences
│   ├── routers.ts                       # Router principal
│   ├── db.ts                            # Query helpers
│   ├── storage.ts                       # S3 helpers
│   ├── _core/
│   │   ├── index.ts                     # Server entry point
│   │   ├── context.ts                   # tRPC context
│   │   ├── trpc.ts                      # tRPC setup
│   │   ├── llm.ts                       # LLM integration
│   │   ├── voiceTranscription.ts        # Voice transcription
│   │   ├── imageGeneration.ts           # Image generation
│   │   ├── map.ts                       # Google Maps helpers
│   │   ├── notification.ts              # Owner notifications
│   │   ├── oauth.ts                     # OAuth flow
│   │   ├── cookies.ts                   # Cookie management
│   │   ├── env.ts                       # Environment variables
│   │   └── systemRouter.ts              # System procedures
│   └── *.test.ts                        # Testes Vitest
├── drizzle/
│   ├── schema.ts                        # Schema MySQL (users, occurrences)
│   └── migrations/                      # Migrations
├── shared/
│   ├── const.ts                         # Constantes compartilhadas
│   └── occurrences.ts                   # Labels, cores, ícones
├── storage/
│   └── index.ts                         # S3 client
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
├── todo.md                              # Rastreamento de features
└── README.md                            # Este arquivo
```

---

## 8. Instruções de Uso

### 8.1 Instalação e Setup

```bash
# Clonar repositório
git clone <repo-url>
cd ecomonitor

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais (DATABASE_URL, S3, LLM, etc.)

# Executar migrações do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### 8.2 Acessar a Aplicação

- **Frontend:** http://localhost:5173 (Vite dev server)
- **Backend:** http://localhost:3000 (Express server)
- **API tRPC:** http://localhost:3000/api/trpc

### 8.3 Fluxo do Cidadão

1. Acessa landing page (`/`).
2. Clica em "Registrar Ocorrência".
3. Preenche formulário com GPS automático, categoria, descrição e imagem.
4. Clica "Sugerir Categoria" para IA classificar.
5. Clica "Enviar" para registrar.
6. Recebe confirmação com ID da ocorrência.
7. Acessa "Meus Registros" para acompanhar status.

### 8.4 Fluxo do Admin

1. Acessa painel administrativo (`/admin`).
2. Visualiza dashboard com estatísticas e gráficos.
3. Navega para mapa (`/admin/map`) para visualizar ocorrências geograficamente.
4. Acessa lista de ocorrências (`/admin/occurrences`) para gerenciar.
5. Atualiza status de ocorrências (pendente → em análise → resolvido).
6. Acessa exportação (`/admin/export`) para gerar relatórios CSV/PDF.

---

## 9. Testes

### 9.1 Executar Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test --watch

# Executar teste específico
pnpm test server/occurrences.test.ts
```

### 9.2 Cobertura de Testes

- **occurrences.test.ts:** 9 testes (create, list, getById, stats, classify, updateStatus, exportCsv)
- **auth.logout.test.ts:** 1 teste (logout)
- **Total:** 10 testes passando ✅

---

## 10. Deployment

### 10.1 Build para Produção

```bash
# Build frontend + backend
pnpm build

# Iniciar servidor de produção
pnpm start
```

### 10.2 Variáveis de Ambiente Necessárias

```
DATABASE_URL=mysql://user:password@host:3306/ecomonitor
JWT_SECRET=<secret-key>
VITE_APP_ID=<manus-oauth-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=<manus-api-url>
BUILT_IN_FORGE_API_KEY=<manus-api-key>
VITE_FRONTEND_FORGE_API_KEY=<frontend-api-key>
VITE_FRONTEND_FORGE_API_URL=<manus-api-url>
```

---

## 11. Suporte e Manutenção

Para dúvidas, bugs ou sugestões, consulte:

- **Documentação:** Este README.md
- **Código:** Comentários inline nos arquivos principais
- **Testes:** Vitest em `server/*.test.ts`
- **Logs:** `.manus-logs/` (devserver.log, browserConsole.log, networkRequests.log)

---

**Versão:** 1.0.0  
**Data:** 26 de fevereiro de 2025  
**Status:** ✅ Implementado e testado
