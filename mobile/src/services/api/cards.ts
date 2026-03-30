import {apiRequest} from './client';

export type CreateCardPayload = {
  name: string;
  cardNumber: string;
  lastFourDigits: string;
  cardType: 'credit' | 'debit' | 'prepaid';
  expiryDate: string;
};

export type Card = {
  id: string;
  name: string;
  lastFourDigits: string;
  cardType: string;
  brand: string;
  expiryDate: string;
  createdAt: string;
};

export type CreateCardResponse = {
  id: string;
  name: string;
  brand: string;
  lastFourDigits: string;
};

export type ListCardsResponse = Card[];

export type UpdateCardPayload = {
  name?: string;
  expiryDate?: string;
};

export async function createCard(payload: CreateCardPayload) {
  return apiRequest<CreateCardResponse>('/cards', {
    method: 'POST',
    body: payload,
  });
}

export async function listCards() {
  return apiRequest<ListCardsResponse>('/cards', {
    method: 'GET',
    cacheTTL: 300000,
  });
}

export async function getCard(cardId: string) {
  return apiRequest<Card>(`/cards/${cardId}`, {
    method: 'GET',
  });
}

export async function updateCard(cardId: string, payload: UpdateCardPayload) {
  return apiRequest<Card>(`/cards/${cardId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteCard(cardId: string) {
  return apiRequest<{message: string}>(`/cards/${cardId}`, {
    method: 'DELETE',
  });
}
