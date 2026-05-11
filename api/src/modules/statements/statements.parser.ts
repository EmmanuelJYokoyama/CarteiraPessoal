import {ParsedStatement, ParsedTransaction, StatementFormat} from './statements.types';

export class StatementParser {
  static parse(content: string, format: StatementFormat): ParsedStatement {
    if (format === 'ofx') {
      return this.parseOFX(content);
    }
    if (format === 'csv') {
      return this.parseCSV(content);
    }
    return {format, transactions: [], errors: ['Formato não suportado']};
  }

  private static parseOFX(content: string): ParsedStatement {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    try {
      // Extrair todas as transações do bloco <STMTTRN>...</STMTTRN>
      const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;

      while ((match = txRegex.exec(content)) !== null) {
        const txBlock = match[1];

        // Extrair campos
        const dateMatch = txBlock.match(/<DTPOSTED>(\d{8})/);
        const amountMatch = txBlock.match(/<TRNAMT>([^<]+)/);
        const typeMatch = txBlock.match(/<TRNTYPE>([^<]+)/);
        const nameMatch = txBlock.match(/<NAME>([^<]+)/);

        if (!dateMatch || !amountMatch) {
          errors.push('Transação com campos faltando');
          continue;
        }

        const date = dateMatch[1];
        const amount = Math.abs(parseFloat(amountMatch[1]));
        const type = typeMatch?.[1]?.toUpperCase() || 'DEBIT';
        const description = nameMatch?.[1]?.trim() || 'Transação';

        // Converter data YYYYMMDD para ISO
        const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

        transactions.push({
          date: isoDate,
          description,
          amount,
          type: type === 'DEBIT' || type === 'PAYMENT' ? 'debit' : 'credit',
        });
      }

      if (transactions.length === 0) {
        errors.push('Nenhuma transação encontrada no arquivo OFX');
      }

      return {format: 'ofx', transactions, errors};
    } catch (error) {
      errors.push(`Erro ao fazer parsing OFX: ${(error as Error).message}`);
      return {format: 'ofx', transactions: [], errors};
    }
  }

  private static parseCSV(content: string): ParsedStatement {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    try {
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l);

      if (lines.length < 2) {
        errors.push('Arquivo vazio');
        return {format: 'csv', transactions, errors};
      }

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));

        if (parts.length < 3) continue;

        const dateStr = parts[0];
        const description = parts[1] || 'Transação';
        const amountStr = parts[2];

        // Parse date
        const date = this.parseDate(dateStr);
        if (!date) continue;

        // Parse amount
        const amount = this.parseAmount(amountStr);
        if (isNaN(amount) || amount === 0) continue;

        // Detect type
        const isDebit =
          amountStr.startsWith('-') ||
          description.toLowerCase().includes('débito') ||
          description.toLowerCase().includes('saque');

        transactions.push({
          date,
          description,
          amount: Math.abs(amount),
          type: isDebit ? 'debit' : 'credit',
        });
      }

      if (transactions.length === 0) {
        errors.push('Nenhuma transação válida encontrada');
      }

      return {format: 'csv', transactions, errors};
    } catch (error) {
      errors.push(`Erro ao fazer parsing CSV: ${(error as Error).message}`);
      return {format: 'csv', transactions: [], errors};
    }
  }

  private static parseDate(dateStr: string): string | null {
    // Tentar formatos comuns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const formats = [
      {regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, pos: {d: 1, m: 2, y: 3}},
      {regex: /^(\d{2})-(\d{2})-(\d{4})$/, pos: {d: 1, m: 2, y: 3}},
      {regex: /^(\d{4})-(\d{2})-(\d{2})$/, pos: {d: 3, m: 2, y: 1}},
      {regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, pos: {d: 3, m: 2, y: 1}},
    ];

    for (const fmt of formats) {
      const match = dateStr.match(fmt.regex);
      if (!match) continue;

      const d = match[fmt.pos.d].padStart(2, '0');
      const m = match[fmt.pos.m].padStart(2, '0');
      const y = match[fmt.pos.y];

      return `${y}-${m}-${d}`;
    }

    return null;
  }

  private static parseAmount(amountStr: string): number {
    const cleaned = amountStr
      .replace(/[R$\s]/g, '')
      .replace('.', '')
      .replace(',', '.');

    return parseFloat(cleaned);
  }
}
