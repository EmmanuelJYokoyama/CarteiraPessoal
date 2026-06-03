import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api/client';

const { WorkManagerModule } = NativeModules;

interface ThresholdData {
  id: string;
  name: string;
  current: number;
  target: number;
  type: 'budget' | 'goal';
}

/**
 * Verifica os limites e dispara notificações baseadas nas regras de negócio:
 * - Alerta preventivo ao atingir 80%
 * - Alerta de estouro/atingimento ao atingir 100%
 */
export const checkThresholdsAndNotify = async (force = false) => {
  try {
    console.log('[BackgroundTasks] Iniciando check de limites...');
    
    // 1. Buscar dados consolidados (O endpoint deve retornar o progresso atualizado)
    const [budgets, goals] = await Promise.all([
      apiRequest<ThresholdData[]>('/budgets/status', { method: 'GET' }).catch(err => {
        console.error('[BackgroundTasks] Erro /budgets/status:', err.message);
        return [];
      }),
      apiRequest<ThresholdData[]>('/goals/status', { method: 'GET' }).catch(() => []),
    ]).catch(err => {
      console.error('[BackgroundTasks] Falha ao buscar status da API:', err);
      return [[], []];
    });

    const allItems = [...budgets, ...goals];
    const now = new Date();
    const periodKey = `${now.getFullYear()}-${now.getMonth()}`;

    console.log(`[BackgroundTasks] Verificando ${allItems.length} itens.`);

    for (const item of allItems) {
      const current = Number(item.current || 0);
      const target = Number(item.target || 0);

      if (target <= 0) continue; // Evita divisão por zero

      const progress = current / target;
      const storageKey = `@alert_sent_${item.id}_${periodKey}`;
      
      // Recupera o que já foi notificado para este item neste mês
      const lastAlertLevel = force ? null : await AsyncStorage.getItem(storageKey);

      let title = '';
      let message = '';
      let newLevel = '';

      console.log(`[BackgroundTasks] Item: ${item.name}, Progresso: ${(progress * 100).toFixed(1)}%`);

      if (progress >= 1.0 && lastAlertLevel !== '100') {
        // Critério: 100% atingido ou estourado
        console.log(`[BackgroundTasks] Gatilho 100% para ${item.name}`);
        newLevel = '100';
        if (item.type === 'budget') {
          title = '🚨 Orçamento Estourado!';
          message = `Você ultrapassou o limite planejado para "${item.name}".`;
        } else {
          title = '🎉 Meta Atingida!';
          message = `Parabéns! Você alcançou 100% da meta "${item.name}".`;
        }
      } else if (progress >= 0.8 && progress < 1.0 && lastAlertLevel !== '80') {
        // Critério: Alerta preventivo de 80%
        console.log(`[BackgroundTasks] Gatilho 80% para ${item.name}`);
        newLevel = '80';
        const remaining = (target - current).toFixed(2);
        title = '⚠️ Atenção ao Limite';
        message = `Você já utilizou 80% de "${item.name}". Restam apenas R$ ${remaining}.`;
      }

      if (title && message && Platform.OS === 'android' && WorkManagerModule) {
        console.log(`[BackgroundTasks] Disparando notificação: ${title}`);
        WorkManagerModule.showLocalNotification(title, message);
        await AsyncStorage.setItem(storageKey, newLevel);
      }
    }
  } catch (error) {
    console.error('[BackgroundTasks] Erro ao verificar thresholds:', error);
  }
};

/**
 * Limpa o cache de alertas enviados para fins de teste
 */
export const resetAlertCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const alertKeys = keys.filter(key => key.startsWith('@alert_sent_'));
  if (alertKeys.length > 0) {
    await AsyncStorage.multiRemove(alertKeys);
  }
  console.log('[BackgroundTasks] Cache de alertas limpo.');
};

/**
 * Esta função roda em um ambiente JS isolado (Headless JS)
 */
export const backgroundNotificationTask = async () => {
  console.log('[BackgroundTasks] Executando verificação periódica...');
  await checkThresholdsAndNotify();
  return Promise.resolve();
};

export const scheduleNotifications = () => {
  if (Platform.OS === 'android' && WorkManagerModule) {
    WorkManagerModule.schedulePeriodicReminders();
  }
};