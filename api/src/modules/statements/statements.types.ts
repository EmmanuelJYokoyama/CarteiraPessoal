export type StatementFormat = 'ofx' | 'csv';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

export interface ParsedStatement {
  format: StatementFormat;
  transactions: ParsedTransaction[];
  errors: string[];
}

export interface ImportResult {
  imported: number;
  failed: number;
  duplicates: number;
  errors: string[];
}
