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

  const user = request.user as JwtPayload;
  const {content, format, cardId} = request.body as any;

  if (!content || !format || !cardId) {
    return reply.status(400).send({error: 'Missing: content, format, cardId'});
  }

  if (!['ofx', 'csv'].includes(format)) {
    return reply.status(400).send({error: 'Invalid format: use ofx or csv'});
  }

  try {
    const parsed = await parseStatement(content, format);

    if (parsed.transactions.length === 0) {
      return reply.status(400).send({error: parsed.errors[0] || 'No transactions found'});
    }

    const result = await importStatementTransactions(user.userId, cardId, parsed);

    reply.send({
      imported: result.imported,
      failed: result.failed,
      duplicates: result.duplicates,
      errors: result.errors,
    });
  } catch (error) {
    reply.status(500).send({error: 'Import failed'});
  }
}

export async function testParseStatementHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const {content, format} = request.body as any;

  if (!content || !format) {
    return reply.status(400).send({error: 'Missing: content, format'});
  }

  if (!['ofx', 'csv'].includes(format)) {
    return reply.status(400).send({error: 'Invalid format: use ofx or csv'});
  }

  try {
    const parsed = await parseStatement(content, format);

    reply.send({
      format,
      transactionCount: parsed.transactions.length,
      transactions: parsed.transactions,
      errors: parsed.errors,
    });
  } catch (error) {
    reply.status(500).send({error: 'Parse failed'});
  }
}
