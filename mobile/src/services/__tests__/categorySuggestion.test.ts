import AsyncStorage from '@react-native-async-storage/async-storage';
import {listAllTransactions} from '../api/transactions';
import {
  getLearnedCategorySuggestionFromEntries,
  recordCategoryLearning,
  suggestCategory,
} from '../categorySuggestion';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../api/transactions', () => ({
  listAllTransactions: jest.fn(),
}));

const asyncStorageMock = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const listAllTransactionsMock = listAllTransactions as jest.MockedFunction<typeof listAllTransactions>;

describe('categorySuggestion', () => {
  let storageValue: string | null;

  beforeEach(() => {
    jest.clearAllMocks();
    storageValue = null;
    asyncStorageMock.getItem.mockImplementation(async () => storageValue);
    asyncStorageMock.setItem.mockImplementation(async (_key, value) => {
      storageValue = value;
    });
    listAllTransactionsMock.mockResolvedValue([] as Awaited<ReturnType<typeof listAllTransactions>>);
  });

  it('prefers the learned category cache for a repeated description', async () => {
    asyncStorageMock.getItem.mockResolvedValue(
      JSON.stringify({
        'padaria central': {
          votes: {Alimentação: 2, Mercado: 1},
          lastUsedAt: '2026-05-21T00:00:00.000Z',
        },
      })
    );

    const result = await suggestCategory('Padaria Central');

    expect(result).toMatchObject({category: 'Alimentação', occurrences: 2});
    expect(listAllTransactionsMock).not.toHaveBeenCalled();
  });

  it('persists confirmed categories as votes', async () => {
    storageValue = JSON.stringify({
      'café do centro': {
        votes: {Lazer: 1},
        lastUsedAt: '2026-05-21T00:00:00.000Z',
      },
    });

    await recordCategoryLearning('Café do Centro', 'Lazer');

    await recordCategoryLearning('Café do Centro', 'Alimentação');

    const parsedValue = JSON.parse(storageValue ?? '{}') as Record<
      string,
      {votes: Record<string, number>; lastUsedAt: string}
    >;

    expect(parsedValue['café do centro'].votes).toEqual({Lazer: 2, Alimentação: 1});
  });

  it('builds a suggestion from learned entries without storage access', () => {
    const result = getLearnedCategorySuggestionFromEntries('Farmácia Popular', {
      'farmacia popular': {
        votes: {Saúde: 4, Casa: 1},
        lastUsedAt: '2026-05-21T00:00:00.000Z',
      },
    });

    expect(result).toMatchObject({category: 'Saúde', occurrences: 4});
  });
});
