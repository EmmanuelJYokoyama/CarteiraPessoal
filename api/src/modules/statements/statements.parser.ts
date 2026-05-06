import {ParsedStatement, ParsedStatementTransaction, StatementFormat} from './statements.types';

export class StatementParser {
  static parse(content: string, format: StatementFormat): ParsedStatement {
    if (format === 'ofx') {
      return this.parseOFX(content);
    } else if (format === 'csv') {
      return this.parseCSV(content);
    }
    return {
      format,
      transactions: [],
      errors: ['Formato não suportado'],
    };
  }

  private static parseOFX(content: string): ParsedStatement {
    const errors: string[] = [];
    const transactions: ParsedStatementTransaction[] = [];

    try {
      // Extract STMTRS section (OFX statement response)
      const stmtMatch = content.match(/<STMTRS>([\s\S]*?)<\/STMTRS>/);
      if (!stmtMatch) {
        errors.push('Não foi encontrado bloco STMTRS no arquivo OFX');
        return {format: 'ofx', transactions, errors};
      }

      const stmtContent = stmtMatch[1];

      // Extract bank info
      const bankMatch = content.match(/<BANKID>(\d+)<\/BANKID>/);
      const accountMatch = content.match(/<ACCTID>([^<]+)<\/ACCTID>/);
      const currencyMatch = content.match(/<CURR><CURSYM>([^<]+)<\/CURSYM>/);

      const bank = bankMatch ? this.identifyBank(bankMatch[1]) : undefined;
      const accountNumber = accountMatch ? accountMatch[1] : undefined;
      const currency = currencyMatch ? currencyMatch[1] : 'BRL';

      // Extract transactions from STMTTRN
      const transactionMatches = stmtContent.matchAll(
        /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
      );

      for (const match of transactionMatches) {
        const txContent = match[1];

        const typeMatch = txContent.match(/<TRNTYPE>([^<]+)<\/TRNTYPE>/);
        const amountMatch = txContent.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
        const dateMatch = txContent.match(/<DTPOSTED>(\d{8})<\/DTPOSTED>/);
        const idMatch = txContent.match(/<FITID>([^<]+)<\/FITID>/);
        const nameMatch = txContent.match(/<NAME>([^<]+)<\/NAME>/);
        const memoMatch = txContent.match(/<MEMO>([^<]+)<\/MEMO>/);

        if (!typeMatch || !amountMatch || !dateMatch) {
          errors.push('Transação OFX incompleta encontrada');
          continue;
        }

        const type = typeMatch[1].toUpperCase();
        const amount = Math.abs(parseFloat(amountMatch[1]));
        const dateStr = dateMatch[1];
        const date = this.formatOFXDate(dateStr);
        const id = idMatch ? idMatch[1] : undefined;
        const description =
          nameMatch?.[1] || memoMatch?.[1] || 'Sem descrição';

        transactions.push({
          date,
          description: description.trim(),
          amount,
          type: type === 'DEBIT' || type === 'CHECK' || type === 'PAYMENT' ? 'debit' : 'credit',
          originalAmount: amountMatch[1],
          referenceId: id,
        });
      }

      if (transactions.length === 0) {
        errors.push('Nenhuma transação foi extraída do arquivo OFX');
      }

      return {
        format: 'ofx',
        transactions,
        bank,
        accountNumber,
        currency,
        errors,
      };
    } catch (error) {
      errors.push((error as Error).message || 'Erro ao fazer parsing OFX');
      return {format: 'ofx', transactions, errors};
    }
  }

  private static parseCSV(content: string): ParsedStatement {
    const errors: string[] = [];
    const transactions: ParsedStatementTransaction[] = [];

    try {
      const lines = content.split('\n').filter(l => l.trim());

      if (lines.length < 2) {
        errors.push('Arquivo CSV vazio ou sem dados');
        return {format: 'csv', transactions, errors};
      }

      // Detectar formato pelo header
      const header = lines[0].toLowerCase();
      const hasDate = header.includes('data') || header.includes('date');
      const hasAmount = header.includes('valor') || header.includes('amount');
      const hasDescription = header.includes('descri') || header.includes('description');

      if (!hasDate || !hasAmount) {
        errors.push(
          'Colunas obrigatórias não encontradas (data, valor). Esperado: data, descrição, valor (ou equivalentes em inglês)'
        );
        return {format: 'csv', transactions, errors};
      }

      // Parse CSV simples (sem library externa)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = this.parseCSVLine(line);

        if (fields.length < 3) {
          errors.push(`Linha ${i + 1}: Campos insuficientes`);
          continue;
        }

        const dateStr = fields[0].trim();
        const description = fields[1].trim() || 'Sem descrição';
        const amountStr = fields[2].trim();

        const date = this.formatCSVDate(dateStr);
        if (!date) {
          errors.push(`Linha ${i + 1}: Data inválida`);
          continue;
        }

        const amount = this.parseAmount(amountStr);
        if (isNaN(amount) || amount === 0) {
          errors.push(`Linha ${i + 1}: Valor inválido`);
          continue;
        }

        // Detectar tipo pela prefixo ou valor negativo
        const isDebit =
          amountStr.startsWith('-') ||
          description.toLowerCase().includes('débito') ||
          description.toLowerCase().includes('compra');

        transactions.push({
          date,
          description,
          amount: Math.abs(amount),
          type: isDebit ? 'debit' : 'credit',
          originalAmount: amountStr,
        });
      }

      if (transactions.length === 0) {
        errors.push('Nenhuma transação válida foi extraída');
      }

      return {format: 'csv', transactions, errors};
    } catch (error) {
      errors.push((error as Error).message || 'Erro ao fazer parsing CSV');
      return {format: 'csv', transactions, errors};
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private static formatOFXDate(dateStr: string): string {
    // OFX format: YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  private static formatCSVDate(dateStr: string): string | null {
    // Tentar vários formatos comuns
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{4})\/(\d{2})\/(\d{2})/, // YYYY/MM/DD
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // D/M/YY ou DD/MM/YY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (!match) continue;

      let year = '';
      let month = '';
      let day = '';

      if (format.toString().includes('YYYY')) {
        if (match[1].length === 4) {
          year = match[1];
          month = match[2];
          day = match[3];
        } else {
          day = match[1];
          month = match[2];
          year = match[3];
        }
      } else {
        day = match[1];
        month = match[2];
        year = match[3];
      }

      // Handle 2-digit year
      if (year.length === 2) {
        const y = parseInt(year);
        year = (y < 50 ? 2000 : 1900) + y + '';
      }

      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      if (isNaN(date.getTime())) continue;

      return date.toISOString().split('T')[0] + 'T00:00:00Z';
    }

    return null;
  }

  private static parseAmount(amountStr: string): number {
    // Remove símbolos de moeda e espaços
    const cleaned = amountStr
      .replace(/[R$€£]/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    return parseFloat(cleaned);
  }

  private static identifyBank(bankCode: string): string {
    const bankMap: Record<string, string> = {
      '001': 'Banco do Brasil',
      '033': 'Santander',
      '104': 'Caixa',
      '237': 'Bradesco',
      '341': 'Itaú',
      '389': 'Banco Mercantil',
      '409': 'Unibanco',
      '479': 'Banco ItauBank',
      '655': 'Banco Votorantim',
    };

    return bankMap[bankCode] || `Banco ${bankCode}`;
  }
}
