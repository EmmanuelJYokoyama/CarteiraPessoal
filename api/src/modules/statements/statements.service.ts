import {db} from '@db/index';
import {transactions} from '@db/schema/transactions';
import {StatementParser} from './statements.parser';
import {ParsedStatement, StatementFormat, ImportResult} from './statements.types';
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
  parsed: ParsedStatement
): Promise<ImportResult> {
  const result: ImportResult = {imported: 0, failed: 0, duplicates: 0, errors: []};

  for (const tx of parsed.transactions) {
    try {
      // Check for duplicates
      const existing = await findDuplicateTransactions(userId, {
        description: tx.description,
        amount: tx.amount.toString(),
        transactionDate: tx.date,
        cardId,
      });

      if (existing.length > 0) {
        result.duplicates++;
        continue;
      }

      // Insert transaction
      await db.insert(transactions).values({
        userId,
        cardId,
        description: tx.description,
        amount: tx.amount.toString(),
        installments: 1,
        installmentsPaid: 0,
        category: tx.type === 'debit' ? 'Compra' : 'Crédito',
        status: 'completed',
        transactionDate: new Date(tx.date),
      });

      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Erro ao importar: ${tx.description}`);
    }
  }

  return result;
}
