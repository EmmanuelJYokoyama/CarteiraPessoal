import {FastifyRequest, FastifyReply} from 'fastify';
import {JwtPayload} from '../../types/jwt';
import {parseStatement, importStatementTransactions} from './statements.service';
import {StatementFormat} from './statements.types';

export async function importStatementHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  try {
    const user = request.user as JwtPayload;
    const {content, format, cardId} = request.body as {
      content: string;
      format: StatementFormat;
      cardId: string;
    };

    if (!content || !format || !cardId) {
      return reply.status(400).send({
        error: 'Campos obrigatórios: content, format (ofx|csv), cardId',
      });
    }

    if (format !== 'ofx' && format !== 'csv') {
      return reply.status(400).send({error: 'Formato inválido. Use: ofx ou csv'});
    }

    // Parse the statement
    const parsed = await parseStatement(content, format);

    if (parsed.errors.length > 0 && parsed.transactions.length === 0) {
      return reply.status(400).send({
        error: 'Erro ao fazer parsing do extrato',
        details: parsed.errors,
      });
    }

    // Import transactions
    const result = await importStatementTransactions(
      user.userId,
      cardId,
      parsed
    );

    reply.status(200).send({
      success: true,
      message: `Importação concluída: ${result.imported} transações importadas`,
      result: {
        imported: result.imported,
        failed: result.failed,
        duplicates: result.duplicates,
        transactions: result.transactions,
      },
      warnings: parsed.errors,
    });
  } catch (error: any) {
    console.error('Erro ao importar extrato:', error);
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function testParseStatementHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const {content, format} = request.body as {
      content: string;
      format: StatementFormat;
    };

    if (!content || !format) {
      return reply.status(400).send({
        error: 'Campos obrigatórios: content, format (ofx|csv)',
      });
    }

    if (format !== 'ofx' && format !== 'csv') {
      return reply.status(400).send({error: 'Formato inválido. Use: ofx ou csv'});
    }

    const parsed = await parseStatement(content, format);

    reply.status(200).send({
      format: parsed.format,
      bank: parsed.bank,
      accountNumber: parsed.accountNumber,
      currency: parsed.currency,
      transactionCount: parsed.transactions.length,
      transactions: parsed.transactions.slice(0, 10),
      errors: parsed.errors,
    });
  } catch (error: any) {
    console.error('Erro ao fazer parsing:', error);
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}
