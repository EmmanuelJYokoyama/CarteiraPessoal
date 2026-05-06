import {db} from '@db/index';
import {transactions} from '@db/schema/transactions';
import {StatementParser} from './statements.parser';
import {
  ParsedStatement,
  ParsedStatementTransaction,
  StatementFormat,
  ImportStatementResult,
} from './statements.types';
import {findDuplicateTransactions} from '../transactions/transactions.service';

export async function parseStatement(
  content: string,
  format: StatementFormat
): Promise<ParsedStatement> {
  return StatementParser.parse(content, format);
}

export async function importStatementTransactions(
  userId: string,
  cardId: string,
  parsedStatement: ParsedStatement
): Promise<ImportStatementResult> {
  const result: ImportStatementResult = {
    imported: 0,
    failed: 0,
    duplicates: 0,
    transactions: [],
  };

  if (parsedStatement.transactions.length === 0) {
    return result;
  }

  for (const tx of parsedStatement.transactions) {
    try {
      // Verificar duplicatas
      const duplicates = await findDuplicateTransactions(userId, {
        description: tx.description,
        amount: tx.amount.toString(),
        transactionDate: tx.date,
        cardId,
      });

      if (duplicates.length > 0) {
        result.duplicates++;
        continue;
      }

      // Importar transação
      const newTxResult = await db
        .insert(transactions)
        .values({
          userId,
          cardId,
          description: `[${parsedStatement.format.toUpperCase()}] ${tx.description}`,
          amount: tx.amount.toString(),
          installments: 1,
          installmentsPaid: 0,
          category: tx.type === 'debit' ? 'Importado' : 'Crédito',
          status: 'completed',
          transactionDate: new Date(tx.date),
        })
        .returning();

      const newTx = Array.isArray(newTxResult)
        ? newTxResult[0]
        : newTxResult;

      result.imported++;
      result.transactions.push({
        id: newTx.id,
        description: newTx.description,
        amount: Number(newTx.amount),
        transactionDate: newTx.transactionDate.toISOString(),
      });
    } catch (error) {
      console.error('Erro ao importar transação:', error);
      result.failed++;
    }
  }

  return result;
}
