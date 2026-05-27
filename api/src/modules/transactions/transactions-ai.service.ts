import {and, eq, isNotNull, isNull} from 'drizzle-orm';
import {db} from '@db/index';
import {transactions} from '@db/schema/transactions';
import {getCategoriesByUserId} from '@modules/categories/categories.service';

export type CategorySuggestion = {
  name: string;
  color: string;
  score: number;
};

export type SuggestCategoryResult = {
  success: boolean;
  suggestions: CategorySuggestion[];
  topSuggestion: CategorySuggestion | null;
};

type CategoryIndex = {
  name: string;
  color: string;
};

type FrequencyEntry = {
  categoryName: string;
  color: string;
  count: number;
};

const DEFAULT_CATEGORY_COLOR = '#2ED573';
const MATCH_THRESHOLD = 0.35;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter(token => token.length > 2);
}

function overlapScore(source: string, target: string): number {
  const sourceTokens = tokenize(source);
  const targetTokens = tokenize(target);

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  const targetSet = new Set(targetTokens);
  let matches = 0;

  for (const token of sourceTokens) {
    if (targetSet.has(token)) {
      matches += 1;
    }
  }

  return matches / Math.max(sourceTokens.length, targetTokens.length);
}

function getTransactionMatchScore(input: string, description: string, location: string | null): number {
  const descriptionScore = overlapScore(input, description);
  const locationScore = location ? overlapScore(input, location) : 0;
  const normalizedInput = normalizeText(input);
  const normalizedDescription = normalizeText(description);
  const normalizedLocation = location ? normalizeText(location) : '';

  if (!normalizedInput || !normalizedDescription) {
    return 0;
  }

  if (normalizedInput === normalizedDescription || normalizedInput === normalizedLocation) {
    return 1;
  }

  return Math.max(descriptionScore, locationScore);
}

function buildCategoryIndex(categories: Awaited<ReturnType<typeof getCategoriesByUserId>>): Map<string, CategoryIndex> {
  const index = new Map<string, CategoryIndex>();

  for (const category of categories) {
    index.set(normalizeText(category.name), {
      name: category.name,
      color: category.color || DEFAULT_CATEGORY_COLOR,
    });
  }

  return index;
}

function upsertFrequency(
  frequencies: Map<string, FrequencyEntry>,
  categoryIndex: Map<string, CategoryIndex>,
  categoryName: string,
): void {
  const normalizedCategoryName = normalizeText(categoryName);
  const indexedCategory = categoryIndex.get(normalizedCategoryName);
  const existing = frequencies.get(normalizedCategoryName);

  if (existing) {
    existing.count += 1;
    return;
  }

  frequencies.set(normalizedCategoryName, {
    categoryName: indexedCategory?.name ?? categoryName,
    color: indexedCategory?.color ?? DEFAULT_CATEGORY_COLOR,
    count: 1,
  });
}

function mapFrequenciesToSuggestions(entries: FrequencyEntry[]): CategorySuggestion[] {
  return entries
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.categoryName.localeCompare(right.categoryName);
    })
    .slice(0, 3)
    .map(entry => ({
      name: entry.categoryName,
      color: entry.color,
      score: entry.count,
    }));
}

export async function suggestCategoryForTransaction(userId: string, description: string): Promise<SuggestCategoryResult> {
  const [categories, userTransactions] = await Promise.all([
    getCategoriesByUserId(userId),
    db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        isNull(transactions.parentTransactionId),
        isNotNull(transactions.category),
      ),
    }),
  ]);

  if (categories.length === 0) {
    return {
      success: true,
      suggestions: [],
      topSuggestion: null,
    };
  }

  const categoryIndex = buildCategoryIndex(categories);
  const normalizedInput = normalizeText(description);
  const matchedFrequencies = new Map<string, FrequencyEntry>();

  for (const transaction of userTransactions) {
    if (!transaction.category) {
      continue;
    }

    const matchScore = getTransactionMatchScore(normalizedInput, transaction.description, transaction.location ?? null);

    if (matchScore >= MATCH_THRESHOLD) {
      upsertFrequency(matchedFrequencies, categoryIndex, transaction.category);
    }
  }

  const fallbackFrequencies = new Map<string, FrequencyEntry>();

  if (matchedFrequencies.size === 0) {
    for (const transaction of userTransactions) {
      if (!transaction.category) {
        continue;
      }

      upsertFrequency(fallbackFrequencies, categoryIndex, transaction.category);
    }
  }

  const sourceEntries = matchedFrequencies.size > 0
    ? Array.from(matchedFrequencies.values())
    : Array.from(fallbackFrequencies.values());

  const suggestions = mapFrequenciesToSuggestions(sourceEntries);

  return {
    success: true,
    suggestions,
    topSuggestion: suggestions[0] ?? null,
  };
}
