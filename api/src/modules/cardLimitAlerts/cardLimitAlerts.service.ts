import {db} from '@db/index';
import {cards} from '@db/schema/cards';
import {transactions} from '@db/schema/transactions';
import {eq, and} from 'drizzle-orm';

export interface LimitAlertConfig {
  cardId: string;
  limit: number;
  alertPercentage: number;
  alertEnabled: boolean;
}

export interface LimitAlert {
  cardId: string;
  cardName: string;
  limit: number;
  usedAmount: number;
  usedPercentage: number;
  alertPercentage: number;
  shouldAlert: boolean;
}

export async function getCardLimit(
  cardId: string,
  userId: string
): Promise<LimitAlertConfig | null> {
  const card = await db
    .select({
      cardId: cards.id,
      limit: cards.limit,
      alertPercentage: cards.alertPercentage,
      alertEnabled: cards.alertEnabled,
    })
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

  if (!card || card.length === 0) {
    return null;
  }

  return {
    cardId: card[0].cardId,
    limit: parseFloat(card[0].limit as unknown as string),
    alertPercentage: card[0].alertPercentage || 80,
    alertEnabled: card[0].alertEnabled !== false,
  };
}

export async function updateCardLimit(
  cardId: string,
  userId: string,
  limit: number
): Promise<void> {
  await db
    .update(cards)
    .set({limit: limit.toString(), updatedAt: new Date()})
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
}

export async function updateAlertPercentage(
  cardId: string,
  userId: string,
  alertPercentage: number
): Promise<void> {
  if (alertPercentage < 1 || alertPercentage > 100) {
    throw new Error('INVALID_PERCENTAGE');
  }

  await db
    .update(cards)
    .set({alertPercentage, updatedAt: new Date()})
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
}

export async function toggleAlertEnabled(
  cardId: string,
  userId: string,
  enabled: boolean
): Promise<void> {
  await db
    .update(cards)
    .set({alertEnabled: enabled, updatedAt: new Date()})
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
}

export async function getCardLimitStatus(
  cardId: string,
  userId: string
): Promise<LimitAlert | null> {
  const cardData = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

  if (!cardData || cardData.length === 0) {
    throw new Error('CARD_NOT_FOUND');
  }

  const card = cardData[0];
  const cardLimit = parseFloat(card.limit as unknown as string);

  const cardTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.cardId, cardId),
        eq(transactions.userId, userId),
        eq(transactions.status, 'pending')
      )
    );

  const usedAmount = cardTransactions.reduce((sum, tx) => {
    return sum + parseFloat(tx.amount);
  }, 0);

  const usedPercentage =
    cardLimit > 0 ? (usedAmount / cardLimit) * 100 : 0;
  const alertPercentage = card.alertPercentage || 80;
  const shouldAlert =
    card.alertEnabled !== false && usedPercentage >= alertPercentage;

  return {
    cardId,
    cardName: card.name,
    limit: cardLimit,
    usedAmount,
    usedPercentage: parseFloat(usedPercentage.toFixed(2)),
    alertPercentage,
    shouldAlert,
  };
}

export async function getUserCardsLimitStatus(
  userId: string
): Promise<LimitAlert[]> {
  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  const alerts = await Promise.all(
    userCards.map(card => getCardLimitStatus(card.id, userId))
  );

  return alerts.filter(alert => alert !== null) as LimitAlert[];
}
