export const swaggerConfig = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Carteira Pessoal API',
      description: 'API de Carteira Pessoal',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Autenticação'],
          summary: 'Registrar usuário',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'name', 'phoneNumber'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                    phoneNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Usuário registrado' },
            '400': { description: 'Dados inválidos' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Autenticação'],
          summary: 'Fazer login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login realizado' },
            '401': { description: 'Credenciais inválidas' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Autenticação'],
          summary: 'Renovar token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Token renovado' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Autenticação'],
          summary: 'Fazer logout',
          responses: {
            '200': { description: 'Logout realizado' },
          },
        },
      },
      '/auth/logout-all': {
        post: {
          tags: ['Autenticação'],
          summary: 'Logout de todas as sessões',
          responses: {
            '200': { description: 'Logout de todas realizado' },
          },
        },
      },
      '/cards': {
        get: {
          tags: ['Cartões'],
          summary: 'Listar cartões',
          responses: {
            '200': { description: 'Lista de cartões' },
          },
        },
        post: {
          tags: ['Cartões'],
          summary: 'Criar cartão',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'],
                  properties: {
                    cardNumber: { type: 'string' },
                    cardHolder: { type: 'string' },
                    expiryDate: { type: 'string' },
                    cvv: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Cartão criado' },
          },
        },
      },
      '/cards/{cardId}': {
        get: {
          tags: ['Cartões'],
          summary: 'Obter cartão',
          parameters: [
            {
              name: 'cardId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Cartão encontrado' },
            '404': { description: 'Cartão não encontrado' },
          },
        },
        put: {
          tags: ['Cartões'],
          summary: 'Atualizar cartão',
          parameters: [
            {
              name: 'cardId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Cartão atualizado' },
          },
        },
        delete: {
          tags: ['Cartões'],
          summary: 'Deletar cartão',
          parameters: [
            {
              name: 'cardId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Cartão deletado' },
          },
        },
      },
      '/transactions': {
        get: {
          tags: ['Transações'],
          summary: 'Listar transações',
          parameters: [
            { name: 'skip', in: 'query', schema: { type: 'integer' } },
            { name: 'take', in: 'query', schema: { type: 'integer', maximum: 20 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Lista de transações' },
          },
        },
        post: {
          tags: ['Transações'],
          summary: 'Criar transação',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['description', 'amount', 'category'],
                  properties: {
                    description: { type: 'string' },
                    amount: { type: 'number' },
                    category: { type: 'string' },
                    cardId: { type: 'string' },
                    installments: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Transação criada' },
          },
        },
      },
      '/transactions/summary': {
        get: {
          tags: ['Transações'],
          summary: 'Resumo de transações',
          description: 'Agrupa transações por categoria, mês e período do dia para relatórios',
          parameters: [
            { name: 'periodStart', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'periodEnd', in: 'query', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: {
            '200': { description: 'Resumo consolidado de transações' },
          },
        },
      },
      '/transactions/{transactionId}': {
        get: {
          tags: ['Transações'],
          summary: 'Obter transação',
          parameters: [
            {
              name: 'transactionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Transação encontrada' },
          },
        },
        put: {
          tags: ['Transações'],
          summary: 'Atualizar transação',
          parameters: [
            {
              name: 'transactionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Transação atualizada' },
          },
        },
        delete: {
          tags: ['Transações'],
          summary: 'Deletar transação',
          parameters: [
            {
              name: 'transactionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Transação deletada' },
          },
        },
      },
      '/otp/initiate': {
        post: {
          tags: ['OTP'],
          summary: 'Enviar código OTP',
          responses: {
            '200': { description: 'Código enviado' },
          },
        },
      },
      '/otp/validate': {
        post: {
          tags: ['OTP'],
          summary: 'Validar código OTP',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Código validado' },
          },
        },
      },
      '/pin/set': {
        post: {
          tags: ['PIN'],
          summary: 'Criar PIN',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pin'],
                  properties: {
                    pin: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'PIN criado' },
          },
        },
      },
      '/pin/validate': {
        post: {
          tags: ['PIN'],
          summary: 'Validar PIN',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pin'],
                  properties: {
                    pin: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'PIN validado' },
          },
        },
      },
      '/pin/login': {
        post: {
          tags: ['PIN'],
          summary: 'Login com PIN',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pin'],
                  properties: {
                    pin: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login realizado' },
          },
        },
      },
      '/sms/confirm': {
        post: {
          tags: ['SMS'],
          summary: 'Confirmar código SMS',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'phone'],
                  properties: {
                    code: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Código confirmado' },
          },
        },
      },
      '/sms/resend': {
        post: {
          tags: ['SMS'],
          summary: 'Reenviar código SMS',
          responses: {
            '200': { description: 'Código reenviado' },
          },
        },
      },
      '/billing/statements': {
        get: {
          tags: ['Fatura'],
          summary: 'Listar faturas de todos os cartões',
          description: 'Retorna a fatura atual de todos os cartões do usuário',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Lista de faturas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        cardId: { type: 'string' },
                        cardName: { type: 'string' },
                        billingPeriod: {
                          type: 'object',
                          properties: {
                            startDate: { type: 'string', format: 'date-time' },
                            endDate: { type: 'string', format: 'date-time' },
                            closingDay: { type: 'integer' },
                            dueDay: { type: 'integer' },
                          },
                        },
                        totalAmount: { type: 'string' },
                        pendingAmount: { type: 'string' },
                        completedAmount: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            '401': { description: 'Não autorizado' },
          },
        },
      },
      '/billing/statements/{cardId}': {
        get: {
          tags: ['Fatura'],
          summary: 'Obter fatura de um cartão',
          description: 'Retorna a fatura atual de um cartão específico',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cardId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID do cartão',
            },
          ],
          responses: {
            '200': {
              description: 'Fatura do cartão',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      cardId: { type: 'string' },
                      cardName: { type: 'string' },
                      billingPeriod: {
                        type: 'object',
                        properties: {
                          startDate: { type: 'string', format: 'date-time' },
                          endDate: { type: 'string', format: 'date-time' },
                          closingDay: { type: 'integer' },
                          dueDay: { type: 'integer' },
                        },
                      },
                      transactions: { type: 'array' },
                      totalAmount: { type: 'string' },
                      pendingAmount: { type: 'string' },
                      completedAmount: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Não autorizado' },
            '404': { description: 'Cartão não encontrado' },
          },
        },
      },
      '/billing/statements/{cardId}/by-category': {
        get: {
          tags: ['Fatura'],
          summary: 'Gastos por categoria',
          description: 'Retorna os gastos agrupados por categoria da fatura',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cardId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID do cartão',
            },
          ],
          responses: {
            '200': {
              description: 'Gastos por categoria',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string' },
                        total: { type: 'string' },
                        count: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
            '401': { description: 'Não autorizado' },
            '404': { description: 'Cartão não encontrado' },
          },
        },
      },
    },
  },
} as any;

export const swaggerUIConfig = {
  routePrefix: '/documentation',
};
