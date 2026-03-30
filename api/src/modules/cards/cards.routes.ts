import {FastifyInstance} from 'fastify';
import {
  listCards,
  createNewCard,
  getCard,
  updateCardHandler,
  deleteCardHandler,
} from './cards.controller';

export async function cardsRoutes(app: FastifyInstance) {
  app.get('/cards', listCards);
  app.post('/cards', createNewCard);
  app.get<{Params: {cardId: string}}>('/cards/:cardId', getCard);
  app.put<{Params: {cardId: string}}>('/cards/:cardId', updateCardHandler);
  app.delete<{Params: {cardId: string}}>('/cards/:cardId', deleteCardHandler);
}
