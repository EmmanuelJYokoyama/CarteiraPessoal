# Carteira Pessoal API

## 📚 Documentação

### Acessar Swagger UI

Após iniciar o servidor, acesse:

```
http://localhost:3000/documentation
```

A interface interativa permite:
- ✅ Visualizar todos os endpoints
- ✅ Testar requisições
- ✅ Ver exemplos de request/response
- ✅ Adicionar autenticação Bearer Token

### Arquivos de Documentação

- **[openapi.yaml](./openapi.yaml)** - Especificação completa OpenAPI 3.0
- **[restFiles/examples.rest](./restFiles/examples.rest)** - Exemplos de requisições REST Client
- **[../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)** - Documentação em Markdown

## 🚀 Iniciar o Servidor

### Desenvolvimento

```bash
npm run dev
```

Servidor iniciará em: `http://localhost:3000`

### Produção

```bash
npm run build
npm run start
```

## 📦 Instalar Dependências

```bash
npm install
```

## 🗄️ Banco de Dados

### Supabase

Para o Supabase, use a connection string do pooler quando estiver em rede IPv4:

```env
DATABASE_URL=postgresql://postgres.[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

Se preferir usar a conexão direta do host do projeto, mantenha o `DATABASE_URL` apontando para o host do banco.

### Setup Inicial

```bash
npm run db:generate  # Gerar migrations
npm run db:migrate   # Aplicar ao banco
npm run db:seed      # Popular dados iniciais
```

### Gerenciar Banco

```bash
npm run db:studio   # Abrir Drizzle Studio
```

## 🏗️ Estrutura do Projeto

```
src/
├── modules/          # Módulos de funcionalidades
│   ├── auth/         # Autenticação
│   ├── cards/        # Cartões
│   ├── transactions/ # Transações
│   ├── budgets/      # Orçamentos
│   ├── reports/      # Relatórios
│   ├── otp/          # One-Time Password
│   ├── pin/          # PIN
│   ├── sms/          # SMS
│   └── users/        # Usuários
├── plugins/          # Configurações (JWT, Hash, etc)
├── db/               # Banco de dados
├── utils/            # Utilitários
├── server.ts         # Arquivo principal
└── swagger.config.ts # Configuração Swagger
```

## 🔐 Autenticação

Todos os endpoints (exceto login e register) requerem Bearer Token:

```
Authorization: Bearer <JWT_TOKEN>
```

### Fluxo

1. `POST /auth/register` - Registrar usuário
2. `POST /auth/login` - Login (retorna tokens)
3. Use o `accessToken` nas requisições protegidas
4. Quando expirar, use `POST /auth/refresh` com o `refreshToken`

## 🛠️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz desta pasta:

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/carteira_db
JWT_SECRET=sua_chave_secreta_bem_segura
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_PHONE_NUMBER=+1234567890
RESEND_API_KEY=sua_chave
NODE_ENV=development
```

## 📝 Documentação com JSDoc

Os endpoints estão documentados com JSDoc comments que são convertidos para Swagger/OpenAPI:

```typescript
/**
 * @swagger
 * /endpoint:
 *   post:
 *     tags:
 *       - Tag
 *     summary: Resumo
 *     description: Descrição completa
 */
```

Veja exemplos em: `src/swagger.routes.ts`

## 🧪 Testar Endpoints

### Com REST Client (VS Code)

Abra `restFiles/examples.rest` e clique em "Send Request"

### Com cURL

```bash
curl -X GET http://localhost:3000/health
```

### Com Insomnia/Postman

Importe a especificação `openapi.yaml`

## 📊 Tipos de Dados

### Transação

```json
{
  "id": "transaction_123",
  "description": "Almoço",
  "amount": 45.50,
  "category": "Alimentação",
  "status": "pending",
  "installments": 1,
  "installmentsPaid": 0,
  "transactionDate": "2026-04-11T10:30:00Z",
  "createdAt": "2026-04-11T10:30:00Z"
}
```

### Cartão

```json
{
  "id": "card_123",
  "cardNumber": "****7890",
  "cardHolder": "João Silva",
  "expiryDate": "12/25",
  "brand": "Visa",
  "createdAt": "2026-04-11T10:30:00Z"
}
```

## ⚠️ Códigos de Erro

| Código | Significado |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso proibido |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 500 | Erro interno |
| 502 | Erro externo (SMS, etc) |

## 📞 Suporte

Para dúvidas sobre a documentação:

1. Verifique `http://localhost:3000/documentation`
2. Abra o arquivo `../API_DOCUMENTATION.md`
3. Consulte `restFiles/examples.rest`

## 📜 Licença

MIT

---

**Última atualização**: 11 de Abril de 2026
