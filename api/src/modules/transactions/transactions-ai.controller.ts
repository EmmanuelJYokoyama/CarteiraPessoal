import type {FastifyReply, FastifyRequest} from 'fastify';
import type {AuthTokenPayload} from '../auth/auth.types';
import {suggestCategorySchema} from './transactions-ai.schema';
import {suggestCategoryForTransaction} from './transactions-ai.service';

export async function suggestCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({error: 'Unauthorized'});
  }

  try {
    const parsed = suggestCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({error: parsed.error.flatten()});
    }

    const payload = req.user as AuthTokenPayload;
    const result = await suggestCategoryForTransaction(payload.userId, parsed.data.description);

    return reply.send(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to suggest category';
    console.error('[TransactionsAI] Error:', error);
    return reply.status(500).send({error: message});
  }
}
