import {FastifyRequest, FastifyReply} from 'fastify';
import {JwtPayload} from '../../types/jwt';
import {
  getCardLimitStatus,
  getUserCardsLimitStatus,
  updateCardLimit,
  updateAlertPercentage,
  toggleAlertEnabled,
} from './cardLimitAlerts.service';
import {checkAndNotifyLimitAlerts} from './cardLimitAlerts.notifications';

export async function getCardLimitStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const {cardId} = request.params as {cardId: string};

    const alert = await getCardLimitStatus(cardId, user.userId);

    if (!alert) {
      return reply.status(404).send({error: 'CARD_NOT_FOUND'});
    }

    reply.status(200).send(alert);
  } catch (error) {
    if ((error as Error).message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'CARD_NOT_FOUND'});
    }
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function getUserCardsLimitStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const userId = user.userId;

    const alerts = await getUserCardsLimitStatus(userId);

    reply.status(200).send(alerts);
  } catch (error) {
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function updateCardLimitHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const userId = user.userId;
    const {cardId} = request.params as {cardId: string};
    const {limit} = request.body as {limit: number};

    if (!limit || limit <= 0) {
      return reply.status(400).send({error: 'INVALID_LIMIT'});
    }

    await updateCardLimit(cardId, userId, limit);

    const alert = await getCardLimitStatus(cardId, userId);
    reply.status(200).send(alert);
  } catch (error) {
    if ((error as Error).message === 'CARD_NOT_FOUND') {
      return reply.status(404).send({error: 'CARD_NOT_FOUND'});
    }
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function updateAlertPercentageHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const userId = user.userId;
    const {cardId} = request.params as {cardId: string};
    const {alertPercentage} = request.body as {alertPercentage: number};

    if (!alertPercentage || alertPercentage < 1 || alertPercentage > 100) {
      return reply.status(400).send({error: 'INVALID_PERCENTAGE'});
    }

    await updateAlertPercentage(cardId, userId, alertPercentage);

    const alert = await getCardLimitStatus(cardId, userId);
    reply.status(200).send(alert);
  } catch (error) {
    if ((error as Error).message === 'INVALID_PERCENTAGE') {
      return reply.status(400).send({error: 'INVALID_PERCENTAGE'});
    }
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function toggleAlertEnabledHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const userId = user.userId;
    const {cardId} = request.params as {cardId: string};
    const {enabled} = request.body as {enabled: boolean};

    await toggleAlertEnabled(cardId, userId, enabled);

    const alert = await getCardLimitStatus(cardId, userId);
    reply.status(200).send(alert);
  } catch (error) {
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function checkAlertsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const userId = user.userId;

    const notifications = await checkAndNotifyLimitAlerts(userId);

    reply.status(200).send({
      notificationsChecked: notifications.length,
      notifications,
    });
  } catch (error) {
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}
