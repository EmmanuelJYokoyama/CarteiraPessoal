import AsyncStorage from '@react-native-async-storage/async-storage';
import {listAllTransactions} from './api/transactions';

const CATEGORY_LEARNING_STORAGE_KEY = '@category_suggestion:learning';

type LearnedCategoryEntry = {
  votes: Record<string, number>;
  lastUsedAt: string;
};

type LearnedCategoryMap = Record<string, LearnedCategoryEntry>;

/**
 * Calcula similaridade entre duas strings (0-1)
 * Usa algoritmo de Levenshtein normalizado
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  // Levenshtein distance
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }

  const distance = costs[shorter.length];
  return 1 - distance / longer.length;
}

function normalizeDescription(description: string): string {
  return description.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function loadLearnedCategoryMap(): Promise<LearnedCategoryMap> {
  const storedValue = await AsyncStorage.getItem(CATEGORY_LEARNING_STORAGE_KEY);

  if (!storedValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.entries(parsedValue as Record<string, unknown>).reduce<LearnedCategoryMap>(
      (accumulator, [key, value]) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return accumulator;
        }

        const entry = value as Partial<LearnedCategoryEntry> & {votes?: unknown};
        const votes = entry.votes;

        if (
          !votes ||
          typeof votes !== 'object' ||
          Array.isArray(votes) ||
          typeof entry.lastUsedAt !== 'string'
        ) {
          return accumulator;
        }

        const normalizedVotes = Object.entries(votes as Record<string, unknown>).reduce<Record<string, number>>(
          (voteAccumulator, [category, count]) => {
            if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
              voteAccumulator[category] = count;
            }

            return voteAccumulator;
          },
          {}
        );

        if (Object.keys(normalizedVotes).length === 0) {
          return accumulator;
        }

        accumulator[key] = {
          votes: normalizedVotes,
          lastUsedAt: entry.lastUsedAt,
        };

        return accumulator;
      },
      {}
    );
  } catch {
    return {};
  }
}

async function saveLearnedCategoryMap(map: LearnedCategoryMap): Promise<void> {
  await AsyncStorage.setItem(CATEGORY_LEARNING_STORAGE_KEY, JSON.stringify(map));
}

function getBestCategoryFromVotes(votes: Record<string, number>): {category: string; count: number} | null {
  let topCategory = '';
  let topCount = 0;

  for (const [category, count] of Object.entries(votes)) {
    if (count > topCount) {
      topCategory = category;
      topCount = count;
    }
  }

  if (!topCategory) {
    return null;
  }

  return {category: topCategory, count: topCount};
}

export function getLearnedCategorySuggestionFromEntries(
  description: string,
  learnedCategories: LearnedCategoryMap,
  similarityThreshold: number = 0.85
): CategorySuggestion | null {
  const normalizedDescription = normalizeDescription(description);

  if (!normalizedDescription) {
    return null;
  }

  const weightedVotes: Record<string, number> = {};
  let weightedOccurrences = 0;

  Object.entries(learnedCategories).forEach(([learnedDescription, entry]) => {
    const similarity = calculateStringSimilarity(normalizedDescription, learnedDescription);

    if (similarity < similarityThreshold) {
      return;
    }

    Object.entries(entry.votes).forEach(([category, count]) => {
      const weightedCount = count * similarity;
      weightedVotes[category] = (weightedVotes[category] || 0) + weightedCount;
      weightedOccurrences += weightedCount;
    });
  });

  const bestCategory = getBestCategoryFromVotes(weightedVotes);

  if (!bestCategory) {
    return null;
  }

  return {
    category: bestCategory.category,
    confidence: weightedOccurrences > 0 ? (bestCategory.count / weightedOccurrences) * 100 : 0,
    occurrences: Math.max(1, Math.round(bestCategory.count)),
  };
}

async function getLearnedCategorySuggestion(description: string): Promise<CategorySuggestion | null> {
  const learnedCategories = await loadLearnedCategoryMap();
  return getLearnedCategorySuggestionFromEntries(description, learnedCategories);
}

export async function recordCategoryLearning(description: string, category: string): Promise<void> {
  const normalizedDescription = normalizeDescription(description);
  const normalizedCategory = category.trim();

  if (!normalizedDescription || !normalizedCategory) {
    return;
  }

  const learnedCategories = await loadLearnedCategoryMap();
  const currentEntry = learnedCategories[normalizedDescription] ?? {
    votes: {},
    lastUsedAt: new Date().toISOString(),
  };

  currentEntry.votes[normalizedCategory] = (currentEntry.votes[normalizedCategory] || 0) + 1;
  currentEntry.lastUsedAt = new Date().toISOString();
  learnedCategories[normalizedDescription] = currentEntry;

  await saveLearnedCategoryMap(learnedCategories);
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  occurrences: number;
}

/**
 * Sugere categoria baseado no histórico de transações similar
 * @param description - Descrição da transação
 * @param similarityThreshold - Mínimo de similaridade para considerar (0-1)
 * @returns CategorySuggestion ou null se nenhuma sugestão encontrada
 */
export async function suggestCategory(
  description: string,
  similarityThreshold: number = 0.4
): Promise<CategorySuggestion | null> {
  try {
    if (!description || description.trim().length === 0) {
      console.log('[suggestCategory] Descrição vazia');
      return null;
    }

    console.log('[suggestCategory] Iniciando busca com threshold:', similarityThreshold);

    const learnedSuggestion = await getLearnedCategorySuggestion(description);

    if (learnedSuggestion) {
      console.log('[suggestCategory] ✅ Sugestão local encontrada:', learnedSuggestion);
      return learnedSuggestion;
    }

    const transactions = await listAllTransactions();
    console.log('[suggestCategory] Total de transações no banco:', transactions.length);

    // Log de todas as transações para debug
    if (transactions.length > 0) {
      console.log('[suggestCategory] Primeiras 5 transações:', 
        transactions.slice(0, 5).map(t => ({
          description: t.description,
          category: t.category
        }))
      );
    }

    // Filtrar transações com categoria que têm descrição similar
    const similarTransactions = transactions.filter((tx) => {
      if (!tx.category) {
        console.log(`[suggestCategory] Ignorando "${tx.description}" - sem categoria`);
        return false;
      }

      const similarity = calculateStringSimilarity(description, tx.description);
      const passes = similarity >= similarityThreshold;
      
      if (passes) {
        console.log(`[suggestCategory] ✓ Match: "${tx.description}" (${(similarity*100).toFixed(0)}%) → ${tx.category}`);
      }
      
      return passes;
    });

    console.log('[suggestCategory] Transações similares encontradas:', similarTransactions.length);

    if (similarTransactions.length === 0) {
      console.log('[suggestCategory] ⚠️ Nenhuma transação similar encontrada');
      return null;
    }

    // Contar ocorrências de cada categoria
    const categoryCount: Record<string, number> = {};
    similarTransactions.forEach((tx) => {
      if (tx.category) {
        categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
      }
    });

    console.log('[suggestCategory] Contagem final de categorias:', categoryCount);

    // Encontrar categoria mais frequente
    let topCategory = '';
    let maxCount = 0;

    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    if (!topCategory) {
      console.log('[suggestCategory] ⚠️ Nenhuma categoria encontrada');
      return null;
    }

    // Calcular confiança (percentual de transações que usaram essa categoria)
    const confidence = (maxCount / similarTransactions.length) * 100;
    const result = {
      category: topCategory,
      confidence: confidence,
      occurrences: maxCount,
    };

    console.log('[suggestCategory] ✅ Sugestão final:', result);
    return result;
  } catch (error) {
    console.error('[suggestCategory] ❌ Erro ao sugerir categoria:', error);
    return null;
  }
}

/**
 * Sugere categoria baseado em localização (se disponível)
 * @param latitude - Latitude da transação
 * @param longitude - Longitude da transação
 * @param radiusKm - Raio em km para buscar transações próximas (padrão 0.5km)
 * @returns CategorySuggestion ou null
 */
export async function suggestCategoryByLocation(
  latitude: number | undefined,
  longitude: number | undefined,
  radiusKm: number = 0.5
): Promise<CategorySuggestion | null> {
  try {
    if (!latitude || !longitude) {
      return null;
    }

    const transactions = await listAllTransactions();

    // Filtrar transações com categoria e localização próxima
    const similarTransactions = transactions.filter((tx) => {
      if (!tx.category || !tx.latitude || !tx.longitude) return false;

      // Calcular distância (aproximação simplificada)
      const latDiff = tx.latitude - latitude;
      const lonDiff = tx.longitude - longitude;
      const distanceKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // 1 grau ≈ 111km

      return distanceKm <= radiusKm;
    });

    if (similarTransactions.length === 0) {
      return null;
    }

    // Contar ocorrências de cada categoria
    const categoryCount: Record<string, number> = {};
    similarTransactions.forEach((tx) => {
      if (tx.category) {
        categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
      }
    });

    // Encontrar categoria mais frequente
    let topCategory = '';
    let maxCount = 0;

    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    if (!topCategory) {
      return null;
    }

    const confidence = (maxCount / similarTransactions.length) * 100;

    return {
      category: topCategory,
      confidence: confidence,
      occurrences: maxCount,
    };
  } catch (error) {
    console.error('Erro ao sugerir categoria por localização:', error);
    return null;
  }
}
