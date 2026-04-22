import {FastifyInstance} from 'fastify';
import {
  getCardLimitStatusHandler,
  getUserCardsLimitStatusHandler,
  updateCardLimitHandler,
  updateAlertPercentageHandler,
  toggleAlertEnabledHandler,
  checkAlertsHandler,
} from './cardLimitAlerts.controller';

export async function cardLimitAlertsRoutes(app: FastifyInstance) {
  app.get(
    '/cards/:cardId/limit-status',
    {onRequest: [app.authenticate]},
    getCardLimitStatusHandler
  );

  app.get(
    '/cards/limit-status/all',
    {onRequest: [app.authenticate]},
    getUserCardsLimitStatusHandler
  );

  app.patch(
    '/cards/:cardId/limit',
    {onRequest: [app.authenticate]},
    updateCardLimitHandler
  );

  app.patch(
    '/cards/:cardId/alert-percentage',
    {onRequest: [app.authenticate]},
    updateAlertPercentageHandler
  );

  app.patch(
    '/cards/:cardId/alert-enabled',
    {onRequest: [app.authenticate]},
    toggleAlertEnabledHandler
  );

  app.post(
    '/cards/check-alerts',
    {onRequest: [app.authenticate]},
    checkAlertsHandler
  );
}
