import { FastifyInstance } from 'fastify';

export async function swaggerRoutes(app: FastifyInstance) {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Registrar novo usuário
   *     description: Registra um novo usuário no sistema e envia código de confirmação via SMS
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *               - phoneNumber
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: usuario@email.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: SenhaForte123!
   *               name:
   *                 type: string
   *                 example: João Silva
   *               phoneNumber:
   *                 type: string
   *                 example: +5585998765432
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 userId:
   *                   type: string
   *                   example: user_123
   *                 email:
   *                   type: string
   *                   example: usuario@email.com
   *                 message:
   *                   type: string
   *                   example: E-mail registrado. Verifique o SMS para o código de confirmação.
   *       400:
   *         description: Dados inválidos
   *       409:
   *         description: E-mail já cadastrado
   *       502:
   *         description: Falha ao enviar SMS
   */

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Fazer login
   *     description: Autentica um usuário e retorna tokens de acesso
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: usuario@email.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: SenhaForte123!
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                 refreshToken:
   *                   type: string
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                 name:
   *                   type: string
   *                   example: João Silva
   *                 email:
   *                   type: string
   *                   example: usuario@email.com
   *       401:
   *         description: E-mail ou senha inválidos / Conta não confirmada
   *       500:
   *         description: Erro interno
   */

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Renovar token de acesso
   *     description: Usa o refresh token para obter um novo access token
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token renovado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *       401:
   *         description: Não autorizado / Token inválido
   *       404:
   *         description: Usuário não encontrado
   */

  /**
   * @swagger
   * /cards:
   *   get:
   *     tags:
   *       - Cartões
   *     summary: Listar cartões
   *     description: Lista todos os cartões do usuário autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de cartões
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   cardNumber:
   *                     type: string
   *                   cardHolder:
   *                     type: string
   *                   expiryDate:
   *                     type: string
   *                   brand:
   *                     type: string
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /cards:
   *   post:
   *     tags:
   *       - Cartões
   *     summary: Criar novo cartão
   *     description: Registra um novo cartão para o usuário
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cardNumber
   *               - cardHolder
   *               - expiryDate
   *               - cvv
   *             properties:
   *               cardNumber:
   *                 type: string
   *                 example: 1234567890123456
   *               cardHolder:
   *                 type: string
   *                 example: João Silva
   *               expiryDate:
   *                 type: string
   *                 example: 12/25
   *               cvv:
   *                 type: string
   *                 example: 123
   *     responses:
   *       201:
   *         description: Cartão criado com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /cards/{cardId}:
   *   get:
   *     tags:
   *       - Cartões
   *     summary: Obter detalhes do cartão
   *     description: Retorna os detalhes de um cartão específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cardId
   *         required: true
   *         schema:
   *           type: string
   *         example: card_123
   *     responses:
   *       200:
   *         description: Detalhes do cartão
   *       401:
   *         description: Não autorizado
   *       404:
   *         description: Cartão não encontrado
   */

  /**
   * @swagger
   * /transactions:
   *   get:
   *     tags:
   *       - Transações
   *     summary: Listar transações
   *     description: Lista todas as transações do usuário autenticado
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *       - in: query
   *         name: take
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de transações
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   description:
   *                     type: string
   *                   amount:
   *                     type: number
   *                   category:
   *                     type: string
   *                   transactionDate:
   *                     type: string
   *                     format: date-time
   *                   status:
   *                     type: string
   *                   installments:
   *                     type: integer
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /transactions:
   *   post:
   *     tags:
   *       - Transações
   *     summary: Criar nova transação
   *     description: Registra uma nova transação para o usuário
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - description
   *               - amount
   *               - category
   *             properties:
   *               description:
   *                 type: string
   *                 example: Almoço no restaurante
   *               amount:
   *                 type: number
   *                 example: 45.50
   *               category:
   *                 type: string
   *                 example: Alimentação
   *               cardId:
   *                 type: string
   *               installments:
   *                 type: integer
   *                 default: 1
   *     responses:
   *       201:
   *         description: Transação criada com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /otp/send:
   *   post:
   *     tags:
   *       - OTP
   *     summary: Enviar código OTP
   *     description: Envia um código One-Time Password via SMS
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Código enviado com sucesso
   *       401:
   *         description: Não autorizado
   *       502:
   *         description: Erro ao enviar SMS
   */

  /**
   * @swagger
   * /otp/verify:
   *   post:
   *     tags:
   *       - OTP
   *     summary: Verificar código OTP
   *     description: Verifica um código One-Time Password
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *                 example: 123456
   *     responses:
   *       200:
   *         description: Código verificado com sucesso
   *       400:
   *         description: Código inválido
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /pin/create:
   *   post:
   *     tags:
   *       - PIN
   *     summary: Criar PIN
   *     description: Cria um novo PIN de 4 dígitos para o usuário
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pin
   *             properties:
   *               pin:
   *                 type: string
   *                 example: 1234
   *     responses:
   *       200:
   *         description: PIN criado com sucesso
   *       400:
   *         description: PIN inválido
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /pin/verify:
   *   post:
   *     tags:
   *       - PIN
   *     summary: Verificar PIN
   *     description: Verifica se o PIN fornecido está correto
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pin
   *             properties:
   *               pin:
   *                 type: string
   *                 example: 1234
   *     responses:
   *       200:
   *         description: PIN verificado com sucesso
   *       400:
   *         description: PIN incorreto
   *       401:
   *         description: Não autorizado
   */

  /**
   * @swagger
   * /sms/send:
   *   post:
   *     tags:
   *       - SMS
   *     summary: Enviar SMS
   *     description: Envia um SMS para o usuário autenticado
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 example: Seu código de confirmação é 123456
   *     responses:
   *       200:
   *         description: SMS enviado com sucesso
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *       502:
   *         description: Erro ao enviar SMS
   */
}
