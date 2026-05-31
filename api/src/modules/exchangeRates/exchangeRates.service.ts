type BcbQuote = {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  dataCotacao: string;
  moeda: string;
};

type CachedExchangeRate = {
  currency: string;
  quote: BcbQuote;
  fetchedAt: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const LOOKBACK_DAYS = 10;
const cache = new Map<string, CachedExchangeRate>();

export type ExchangeRateResponse = {
  currency: string;
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataCotacao: string;
  dataHoraCotacao: string;
  source: 'bcb' | 'cache';
  cached: boolean;
};

export type CurrencyConversionResponse = ExchangeRateResponse & {
  originalAmount: number;
  convertedAmount: number;
  conversionRate: number;
};

export function normalizeCurrencyCode(value?: string | null) {
  const currency = (value ?? 'BRL').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Moeda inválida');
  }
  return currency;
}

export async function getExchangeRate(currency: string): Promise<ExchangeRateResponse> {
  const normalizedCurrency = normalizeCurrencyCode(currency);

  if (normalizedCurrency === 'BRL') {
    const now = new Date().toISOString();
    return {
      currency: 'BRL',
      cotacaoCompra: 1,
      cotacaoVenda: 1,
      dataCotacao: now,
      dataHoraCotacao: now,
      source: 'cache',
      cached: true,
    };
  }

  const cached = cache.get(normalizedCurrency);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return serializeRate(cached, 'cache', true);
  }

  try {
    const quote = await fetchLatestQuote(normalizedCurrency);
    const entry = {
      currency: normalizedCurrency,
      quote,
      fetchedAt: now,
    } satisfies CachedExchangeRate;
    cache.set(normalizedCurrency, entry);
    return serializeRate(entry, 'bcb', false);
  } catch (error) {
    if (cached) {
      return serializeRate(cached, 'cache', true);
    }

    throw error;
  }
}

export async function convertCurrencyToBrl(amount: number, currency: string): Promise<CurrencyConversionResponse> {
  const rate = await getExchangeRate(currency);
  const conversionRate = rate.cotacaoVenda;
  const convertedAmount = Number((amount * conversionRate).toFixed(2));

  return {
    ...rate,
    originalAmount: amount,
    convertedAmount,
    conversionRate,
  };
}

export async function listExchangeRates(currencies: string[]) {
  const uniqueCurrencies = Array.from(new Set(currencies.map(normalizeCurrencyCode)));
  return Promise.all(uniqueCurrencies.map(currency => getExchangeRate(currency)));
}

async function fetchLatestQuote(currency: string): Promise<BcbQuote> {
  const today = new Date();

  for (let offset = 0; offset <= LOOKBACK_DAYS; offset++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - offset);

    const url = new URL(
      `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda='${currency}',dataCotacao='${formatBcbDate(targetDate)}')`
    );
    url.searchParams.set('$format', 'json');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json() as {value?: Array<Record<string, unknown>>};
    const quote = data.value?.[0];

    if (!quote) {
      continue;
    }

    const cotacaoCompra = Number(quote.cotacaoCompra);
    const cotacaoVenda = Number(quote.cotacaoVenda);
    const dataHoraCotacao = String(quote.dataHoraCotacao ?? new Date().toISOString());
    const dataCotacao = String(quote.dataCotacao ?? formatBcbDate(targetDate));

    if (Number.isNaN(cotacaoCompra) || Number.isNaN(cotacaoVenda)) {
      continue;
    }

    return {
      cotacaoCompra,
      cotacaoVenda,
      dataHoraCotacao,
      dataCotacao,
      moeda: currency,
    };
  }

  throw new Error(`Falha ao consultar BCB para ${currency}`);
}

function serializeRate(cacheEntry: CachedExchangeRate, source: 'bcb' | 'cache', cached: boolean): ExchangeRateResponse {
  return {
    currency: cacheEntry.currency,
    cotacaoCompra: cacheEntry.quote.cotacaoCompra,
    cotacaoVenda: cacheEntry.quote.cotacaoVenda,
    dataCotacao: cacheEntry.quote.dataCotacao,
    dataHoraCotacao: cacheEntry.quote.dataHoraCotacao,
    source,
    cached,
  };
}

function formatBcbDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${month}-${day}-${year}`;
}