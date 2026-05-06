export type StatementFormat = 'ofx' | 'csv';

export interface ParsedStatement {
  format: StatementFormat;
  transactions: ParsedStatementTransaction[];
  bank?: string;
  accountNumber?: string;
  currency?: string;
  errors: string[];
}

export interface ParsedStatementTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  originalAmount?: string;
  balance?: number;
  referenceId?: string;
}

export interface ImportStatementPayload {
  cardId: string;
  content: string;
  format: StatementFormat;
}

export interface ImportStatementResult {
  imported: number;
  failed: number;
  duplicates: number;
  transactions: {
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
  }[];
}
