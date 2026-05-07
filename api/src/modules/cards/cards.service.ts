import {db} from '@db/index';
import {cards} from '@db/schema/cards';
import {eq, and} from 'drizzle-orm';
import type {CreateCardInput, UpdateCardInput} from './cards.schema';
import {detectCardBrand} from '@utils/cardBrandDetection';

export async function createCard(userId: string, input: CreateCardInput) {
  let brand = 'unknown';

  if (input.cardNumber) {
    brand = detectCardBrand(input.cardNumber);
  }

  const limitValue = input.limit && input.limit.trim() !== '' ? input.limit.trim() : '0';
  console.log('[CardService] Creating card with limit:', limitValue, 'from input:', input.limit);

  const newCard = await db.insert(cards).values({
    userId,
    name: input.name,
    lastFourDigits: input.lastFourDigits,
    cardType: input.cardType,
    brand,
    expiryDate: input.expiryDate,
    limit: limitValue,
  }).returning();

  console.log('[CardService] Card created with limit:', newCard[0].limit);

  return newCard[0];
}

export async function getCardsByUserId(userId: string) {
  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  return userCards;
}

export async function getCardById(cardId: string, userId: string) {
  const card = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

  if (!card || card.length === 0) {
    throw new Error('CARD_NOT_FOUND');
  }

  return card[0];
}

export async function updateCard(
  cardId: string,
  userId: string,
  input: UpdateCardInput
) {
  await getCardById(cardId, userId);

  const updated = await db
    .update(cards)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .returning();

  return updated[0];
}

export async function deleteCard(cardId: string, userId: string) {
  await getCardById(cardId, userId);

  await db.delete(cards).where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

  return {message: 'Cartão deletado com sucesso'};
}
