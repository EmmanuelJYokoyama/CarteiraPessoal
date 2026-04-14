import {db} from '@db/index';
import {cards} from '@db/schema/cards';
import {transactions} from '@db/schema/transactions';
import {eq, and, gte, lt} from 'drizzle-orm';

export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  closingDay: number;
  dueDay: number;
}

export interface CardBillingStatement {
  cardId: string;
  cardName: string;
  billingPeriod: BillingPeriod;
  transactions: any[];
  totalAmount: string;
  pendingAmount: string;
  completedAmount: string;
}

/**
 * Calcula o período de fatura baseado no dia de fechamento
 * @param closingDay - Dia do mês que o fechamento ocorre
 * @param referenceDate - Data de referência (padrão: hoje)
 * @returns Período de fatura (startDate, endDate)
 */
export function calculateBillingPeriod(
  closingDay: number,
  referenceDate: Date = new Date()
): BillingPeriod {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  // Data do fechamento deste mês
  const currentMonthClosing = new Date(year, month, closingDay);

  // Se hoje é antes do fechamento, o período ainda está aberto
  // Period vai de fechamento do mês passado até fechamento deste mês
  let startDate: Date;
  let endDate: Date;

  if (day < closingDay) {
    // Ainda não fechou este mês, então pega do mês anterior
    startDate = new Date(year, month - 1, closingDay);
    endDate = currentMonthClosing;
  } else {
    // Já passou do fechamento, então começa novo período
    startDate = currentMonthClosing;
    endDate = new Date(year, month + 1, closingDay);
  }

  // Retorna com due day (vencimento do período anterior + 10 dias aprox)
  const dueDay = closingDay + 10 <= 31 ? closingDay + 10 : closingDay + 10 - 31;

  return {
    startDate,
    endDate,
    closingDay,
    dueDay,
  };
}

/**
 * Retorna todas as transações de um cartão dentro do período de fatura
 */
export async function getCardBillingStatement(
  cardId: string,
  userId: string
): Promise<CardBillingStatement> {
  // Buscar cartão
  const card = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

  if (!card || card.length === 0) {
    throw new Error('CARD_NOT_FOUND');
  }

  const cardData = card[0];
  const billingPeriod = calculateBillingPeriod(cardData.closingDay || 15);

  // Buscar transações deste cartão dentro do período
  const cardTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.cardId, cardId),
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, billingPeriod.startDate),
        lt(transactions.transactionDate, billingPeriod.endDate)
      )
    );

  // Calcular totais
  const totalAmount = cardTransactions.reduce((sum, tx) => {
    return sum + parseFloat(tx.amount);
  }, 0);

  const pendingAmount = cardTransactions
    .filter(tx => tx.status === 'pending')
    .reduce((sum, tx) => {
      return sum + parseFloat(tx.amount);
    }, 0);

  const completedAmount = cardTransactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => {
      return sum + parseFloat(tx.amount);
    }, 0);

  return {
    cardId,
    cardName: cardData.name,
    billingPeriod,
    transactions: cardTransactions,
    totalAmount: totalAmount.toFixed(2),
    pendingAmount: pendingAmount.toFixed(2),
    completedAmount: completedAmount.toFixed(2),
  };
}

/**
 * Retorna declaração de fatura para todos os cartões do usuário
 */
export async function getUserBillingStatements(
  userId: string
): Promise<CardBillingStatement[]> {
  // Buscar todos os cartões do usuário
  const userCards = await db
    .select()
    .from(cards)
    .where(eq(cards.userId, userId));

  // Calcular statement para cada cartão
  const statements = await Promise.all(
    userCards.map(card => getCardBillingStatement(card.id, userId))
  );

  return statements;
}

/**
 * Retorna gastos agregados por categoria dentro da fatura
 */
export async function getCardStatementByCategory(
  cardId: string,
  userId: string
): Promise<Array<{category: string; total: string; count: number}>> {
  const statement = await getCardBillingStatement(cardId, userId);

  // Agrupar por categoria
  const byCategory: Record<string, {total: number; count: number}> = {};

  statement.transactions.forEach(tx => {
    const category = tx.category || 'Sem categoria';
    if (!byCategory[category]) {
      byCategory[category] = {total: 0, count: 0};
    }
    byCategory[category].total += parseFloat(tx.amount);
    byCategory[category].count += 1;
  });

  // Converter para array ordenado por total
  return Object.entries(byCategory)
    .map(([category, {total, count}]) => ({
      category,
      total: total.toFixed(2),
      count,
    }))
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
}
