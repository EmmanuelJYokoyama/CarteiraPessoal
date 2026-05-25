import type {FastifyInstance} from 'fastify';
import {suggestCategoryHandler} from './transactions-ai.controller';

export async function transactionsAiRoutes(fastify: FastifyInstance) {
  fastify.post('/transactions/suggest-category', suggestCategoryHandler);
}
