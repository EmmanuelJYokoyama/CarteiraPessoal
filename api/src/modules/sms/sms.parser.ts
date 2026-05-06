export interface ParsedSmsData {
  bank: 'itau' | 'bradesco' | 'nubank' | 'unknown';
  amount: number;
  date?: Date;
  establishment?: string;
  merchant?: string;
  rawMessage: string;
  parsed: boolean;
}

const bankPatterns = {
  itau: {
    regex: /Compra aprovada de R\$ ([\d.,]+) em (.+?)(?:\s+em (\d{2}\/\d{2}\/\d{2}))?(?:\s+\d+:\d+)?/i,
    banks: ['ITAU', 'BB', 'BANCO DO BRASIL'],
  },
  bradesco: {
    regex: /Transacao de R\$ ([\d.,]+) com (.+?)(?:\s+em (\d{2}\/\d{2}\/\d{4}))?/i,
    banks: ['BRADESCO', 'BRADESCO PRIME'],
  },
  nubank: {
    regex: /Compra(.+?)de R\$ ([\d.,]+)(?:\s+em\s+(.+?))?(?:\s+[aA]s (\d{2}:\d{2}))?/i,
    banks: ['NUBANK', 'NU'],
  },
};

function formatAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

function parseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;

  const formats = [
    /(\d{2})\/(\d{2})\/(\d{2})/, // DD/MM/YY
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day = parseInt(match[1], 10);
      let month = parseInt(match[2], 10) - 1;
      let year = parseInt(match[3], 10);

      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      return new Date(year, month, day);
    }
  }

  return undefined;
}

export function identifyBank(message: string): string {
  const upperMessage = message.toUpperCase();

  for (const [bank, config] of Object.entries(bankPatterns)) {
    if (config.banks.some(b => upperMessage.includes(b))) {
      return bank;
    }
  }

  return 'unknown';
}

export function parseItauSms(message: string): ParsedSmsData {
  const regex = bankPatterns.itau.regex;
  const match = message.match(regex);

  if (!match) {
    return {
      bank: 'itau',
      amount: 0,
      rawMessage: message,
      parsed: false,
    };
  }

  const amount = formatAmount(match[1]);
  const establishment = match[2]?.trim();
  const date = parseDate(match[3]);

  return {
    bank: 'itau',
    amount,
    establishment,
    date,
    rawMessage: message,
    parsed: true,
  };
}

export function parseBradescoSms(message: string): ParsedSmsData {
  const regex = bankPatterns.bradesco.regex;
  const match = message.match(regex);

  if (!match) {
    return {
      bank: 'bradesco',
      amount: 0,
      rawMessage: message,
      parsed: false,
    };
  }

  const amount = formatAmount(match[1]);
  const establishment = match[2]?.trim();
  const date = parseDate(match[3]);

  return {
    bank: 'bradesco',
    amount,
    establishment,
    date,
    rawMessage: message,
    parsed: true,
  };
}

export function parseNubankSms(message: string): ParsedSmsData {
  const regex = bankPatterns.nubank.regex;
  const match = message.match(regex);

  if (!match) {
    return {
      bank: 'nubank',
      amount: 0,
      rawMessage: message,
      parsed: false,
    };
  }

  const amount = formatAmount(match[2]);
  const establishment = match[3]?.trim();

  return {
    bank: 'nubank',
    amount,
    establishment,
    rawMessage: message,
    parsed: true,
  };
}

export function parseBankSms(message: string): ParsedSmsData {
  const bank = identifyBank(message);

  switch (bank) {
    case 'itau':
      return parseItauSms(message);
    case 'bradesco':
      return parseBradescoSms(message);
    case 'nubank':
      return parseNubankSms(message);
    default:
      return {
        bank: 'unknown',
        amount: 0,
        rawMessage: message,
        parsed: false,
      };
  }
}
