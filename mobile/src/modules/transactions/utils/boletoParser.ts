export type BoletoParseSource = 'barcode' | 'digitable_line';

export type BoletoParseResult = {
  rawInput: string;
  normalized: string;
  source: BoletoParseSource;
  barcode: string;
  digitableLine: string;
  bankCode: string;
  currencyCode: string;
  dueDateFactor: number | null;
  dueDate: string | null;
  amount: number | null;
  isValid: boolean;
  validation: {
    barcodeDvValid: boolean;
    fieldDVsValid: boolean;
  };
};

const BOLETO_BASE_DATE_UTC = Date.UTC(1997, 9, 7);

function onlyDigits(value: string) {
  return value.replace(/\D+/g, '');
}

function calculateMod10CheckDigit(value: string) {
  let sum = 0;
  let shouldDouble = true;

  for (let index = value.length - 1; index >= 0; index--) {
    let digit = Number(value[index]);
    if (Number.isNaN(digit)) {
      continue;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (10 - (sum % 10)) % 10;
}

export function calculateMod11CheckDigit(value: string) {
  let sum = 0;
  let weight = 2;

  for (let index = value.length - 1; index >= 0; index--) {
    const digit = Number(value[index]);
    if (Number.isNaN(digit)) {
      continue;
    }

    sum += digit * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  const digit = 11 - remainder;

  if (digit === 0 || digit === 10 || digit === 11) {
    return 1;
  }

  return digit;
}

function toCurrencyAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  return Number((amount / 100).toFixed(2));
}

function formatDateFromFactor(factor: number | null) {
  if (!factor || factor <= 0) {
    return null;
  }

  const date = new Date(BOLETO_BASE_DATE_UTC + factor * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function formatDigitableLineFromBarcode(barcode: string) {
  const field1Base = barcode.slice(0, 4) + barcode.slice(19, 24);
  const field1 = `${field1Base}${calculateMod10CheckDigit(field1Base)}`;
  const field2Base = barcode.slice(24, 34);
  const field2 = `${field2Base}${calculateMod10CheckDigit(field2Base)}`;
  const field3Base = barcode.slice(34, 44);
  const field3 = `${field3Base}${calculateMod10CheckDigit(field3Base)}`;
  const field4 = barcode.slice(4, 5);
  const field5 = barcode.slice(5, 19);

  return `${field1.slice(0, 5)}.${field1.slice(5)} ${field2.slice(0, 5)}.${field2.slice(5)} ${field3.slice(0, 5)}.${field3.slice(5)} ${field4} ${field5}`;
}

function barcodeFromDigitableLine(digits: string) {
  const field1 = digits.slice(0, 9);
  const field2 = digits.slice(10, 20);
  const field3 = digits.slice(21, 31);
  const field4 = digits.slice(32, 33);
  const field5 = digits.slice(33, 47);

  return `${field1.slice(0, 4)}${field4}${field5}${field1.slice(4)}${field2}${field3}`;
}

function validateFieldDigits(digits: string) {
  if (digits.length !== 47) {
    return false;
  }

  const field1 = digits.slice(0, 9);
  const field2 = digits.slice(10, 20);
  const field3 = digits.slice(21, 31);

  return (
    calculateMod10CheckDigit(field1) === Number(digits.slice(9, 10)) &&
    calculateMod10CheckDigit(field2) === Number(digits.slice(20, 21)) &&
    calculateMod10CheckDigit(field3) === Number(digits.slice(31, 32))
  );
}

export function parseBoletoCode(input: string): BoletoParseResult {
  const normalized = onlyDigits(input);

  if (normalized.length !== 44 && normalized.length !== 47) {
    throw new Error('CÓDIGO_DE_BOLETO_INVÁLIDO');
  }

  const barcode = normalized.length === 44 ? normalized : barcodeFromDigitableLine(normalized);
  const digitableLine = normalized.length === 47 ? normalized : formatDigitableLineFromBarcode(barcode);
  const bankCode = barcode.slice(0, 3);
  const currencyCode = barcode.slice(3, 4);
  const dueDateFactorValue = Number(barcode.slice(5, 9));
  const amountDigits = barcode.slice(9, 19);
  const barcodeDv = Number(barcode.slice(4, 5));
  const calculatedDv = calculateMod11CheckDigit(`${barcode.slice(0, 4)}${barcode.slice(5)}`);
  const fieldDVsValid = normalized.length === 47 ? validateFieldDigits(normalized) : true;
  const barcodeDvValid = barcodeDv === calculatedDv;

  return {
    rawInput: input,
    normalized,
    source: normalized.length === 44 ? 'barcode' : 'digitable_line',
    barcode,
    digitableLine,
    bankCode,
    currencyCode,
    dueDateFactor: Number.isFinite(dueDateFactorValue) ? dueDateFactorValue : null,
    dueDate: formatDateFromFactor(Number.isFinite(dueDateFactorValue) ? dueDateFactorValue : null),
    amount: toCurrencyAmount(amountDigits),
    isValid: barcodeDvValid && fieldDVsValid,
    validation: {
      barcodeDvValid,
      fieldDVsValid,
    },
  };
}

export function formatBoletoAmount(amount: number | null) {
  if (amount === null) {
    return 'Não informado';
  }

  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(amount);
}
