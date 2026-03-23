# 💳 Carteira Pessoal

Aplicativo mobile de finanças pessoais desenvolvido como projeto acadêmico da disciplina **Programação para Dispositivo Móvel I**.

<img src="https://cdn.discordapp.com/attachments/1398144855754014811/1483092553283797173/image.png?ex=69b95513&is=69b80393&hm=8cb3cdaf685258016412246529005cf5e79b79645593a3238b16c4379fda41fd&" width="900" height="600">

---

## 👨‍💻 Autor

**Emmanuel Jun de Noronha Yokoyama**

---

## 📱 Sobre o Projeto

O **Carteira Pessoal** permite que usuários controlem suas finanças pessoais de forma simples e offline-first, com funcionalidades como registro de despesas, gestão de cartões de crédito, orçamentos por período e metas de economia.

---

## 🏗️ Arquitetura

O projeto é organizado como um **monorepo** com dois subprojetos independentes:

```
CarteiraPessoal/
├── mobile/   → aplicativo React Native (TypeScript)
└── api/      → backend Fastify (TypeScript)
```

### Mobile — MVVM
| Camada | Responsabilidade |
|---|---|
| **View** | Screens e componentes — apenas JSX, zero lógica |
| **ViewModel** | Hooks customizados — estado, validação, chamadas de serviço |
| **Model** | WatermelonDB (SQLite local) + chamadas à API REST |

### API — MVC
| Camada | Responsabilidade |
|---|---|
| **Model** | Schemas Drizzle ORM — mapeamento das tabelas PostgreSQL |
| **Controller** | Recebe request, valida com Zod, chama service, retorna response |
| **Service** | Lógica de negócio — independente de req/res |

---

## 🛠️ Stack Tecnológica

### Mobile
| Tecnologia | Uso |
|---|---|
| React Native 0.84 | Framework mobile |
| TypeScript | Linguagem |
| React Navigation | Navegação entre telas |
| WatermelonDB | Banco de dados local (offline-first) |
| AsyncStorage | Armazenamento do JWT |
| Zustand | Gerenciamento de estado global |
| React Native Reusables | Biblioteca de componentes UI |
| Axios | Cliente HTTP |

### API
| Tecnologia | Uso |
|---|---|
| Fastify | Framework web |
| TypeScript | Linguagem |
| Drizzle ORM | ORM para PostgreSQL |
| PostgreSQL | Banco de dados relacional |
| JWT (@fastify/jwt) | Autenticação com access + refresh tokens |
| Zod | Validação de schemas |
| bcrypt | Hash de senhas e PIN |

---

## 📋 Funcionalidades

### ✅ Sprint 1 — Autenticação
- [x] Cadastro com verificação de e-mail (SendGrid)
- [x] Login com autenticação JWT (access token 15min + refresh token 7 dias)
- [x] Login 2FA via SMS (Twilio)
- [x] PIN de acesso rápido (4-6 dígitos, bcrypt)

### 🔄 Sprint 2 — Cartões e Despesas
- [ ] Cadastro de múltiplos cartões de crédito
- [ ] Registro de despesas com parcelamento automático
- [ ] Funcionalidade offline com WatermelonDB
- [ ] Documentação Swagger/OpenAPI

### 🔄 Sprint 3 — Geolocalização e Fatura
- [ ] Cálculo automático da fatura atual
- [ ] Alerta de proximidade do limite
- [ ] Captura de GPS ao registrar despesa
- [ ] Integração com react-native-maps

### 🔄 Sprint 4 — Orçamentos e Metas
- [ ] Orçamentos flexíveis por período
- [ ] Metas de economia com aportes manuais
- [ ] Simulação de investimento com juros compostos
- [ ] Sugestão automática de categoria

### 🔄 Sprint 5 — Relatórios e Notificações
- [ ] Relatório de gastos por categoria (gráfico pizza)
- [ ] Fluxo de caixa mensal (gráfico barras)
- [ ] Notificações push para metas e orçamentos
- [ ] WorkManager para notificações persistentes

### 🔄 Sprint 6 — Integrações
- [ ] Exportação de relatório para PDF
- [ ] Integração com API Banco Central (cotações)
- [ ] Scanner de código de barras de boletos (ZXing)

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Android Studio ou Xcode
- JDK 17

### API (Backend)

```bash
# entrar na pasta
cd api

# instalar dependências
npm install

# configurar variáveis de ambiente
cp .env.example .env
# editar .env com suas credenciais

# rodar migrations
npm run db:generate
npm run db:migrate

# iniciar servidor de desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3000`.
Documentação Swagger disponível em `http://localhost:3000/docs`.

### Mobile

```bash
# entrar na pasta
cd mobile

# instalar dependências (legacy-peer-deps necessário por WatermelonDB)
npm install --legacy-peer-deps

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

---

## 🗄️ Banco de Dados

### Variáveis de ambiente (api/.env)

```env
DATABASE_URL=postgresql://postgres:suasenha@localhost:5432/carteira
JWT_SECRET=sua_chave_secreta_longa
PORT=3000
APP_BASE_URL=http://localhost:3000
SENDGRID_API_KEY=sua_chave_sendgrid
SENDGRID_FROM_EMAIL=no-reply@seu-dominio.com
```

### Comandos Drizzle

```bash
npm run db:generate   # gera arquivos de migration
npm run db:migrate    # aplica migrations no banco
npm run db:studio     # abre Drizzle Studio no browser
```

---

## 📁 Estrutura de Pastas

### Mobile
```
mobile/src/
├── modules/
│   └── auth/
│       ├── screens/        # View — apenas JSX
│       ├── viewmodels/     # ViewModel — lógica e estado
│       ├── services/       # chamadas à API
│       └── types.ts
├── components/
│   ├── common/             # Button, Input, Card...
│   └── charts/             # PieChart, BarChart...
├── navigation/
│   ├── AuthNavigator.tsx   # rotas públicas
│   └── AppNavigator.tsx    # rotas autenticadas
├── services/
│   └── api/
│       ├── client.ts       # axios configurado com JWT
│       └── auth.ts         # endpoints de autenticação
├── store/                  # Zustand
├── utils/
└── App.tsx
```

### API
```
api/src/
├── db/
│   ├── index.ts            # conexão Drizzle + PostgreSQL
│   └── schema/             # Model — tabelas do banco
├── modules/
│   └── auth/
│       ├── auth.routes.ts      # entry point das rotas
│       ├── auth.controller.ts  # Controller
│       ├── auth.service.ts     # lógica de negócio
│       ├── auth.schema.ts      # validação Zod
│       └── auth.types.ts       # tipos TypeScript
├── plugins/
│   └── jwt.ts              # @fastify/jwt configurado
├── utils/
│   ├── hash.ts             # bcrypt helpers
│   └── errors.ts           # erros padronizados
└── server.ts               # bootstrap
```

---

## 🔐 Autenticação

O fluxo de autenticação usa **JWT com refresh tokens**:

```
1. POST /auth/register  → cria usuário inativo + envia e-mail
2. GET  /auth/confirm/:token → ativa a conta
3. POST /auth/login     → retorna accessToken (15min) + refreshToken (7d)
4. Rotas protegidas     → Bearer token no header Authorization
```

O `accessToken` é armazenado no `AsyncStorage` do dispositivo e enviado em todas as requisições autenticadas via interceptor do Axios.

---

## 📄 Licença

Projeto acadêmico — uso educacional.
