// Select a health-check URL that works on device/emulator during development,
// and points to production in release builds.
// Use localhost in development. On Android emulator, if localhost is unreachable,
// run `adb reverse tcp:3000 tcp:3000` on the host to forward the port.
const HEALTH_URL = 'https://carteirapessoal.onrender.com/health';

let isOnline = true;
let listeners: Array<(online: boolean) => void> = [];
let unsubscribeInterval: (() => void) | null = null;

function initConnectivityCheck() {
  const checkConnectivity = async () => {
    try {
      // Se já sabemos que estamos offline via sistema, não precisamos forçar fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // Timeout mais curto para não prender o app

      const response = await fetch(HEALTH_URL, {signal: controller.signal});
      clearTimeout(timeout);

      const wasOnline = isOnline;
      // Só mudamos para online se o servidor responder 200. 
      // Se der erro 500, o servidor está lá, então "estamos" online.
      isOnline = response.status >= 200 && response.status < 500;

      if (wasOnline !== isOnline) {
        console.log(`[Connectivity] Online: ${isOnline}`);
        notifyListeners(isOnline);
      }
    } catch (error) {
      // Enhanced logging for diagnosis: include error.name/message and signal state
      try {
        const errName = error && (error as any).name ? (error as any).name : 'unknown';
        const errMsg = error && (error as any).message ? (error as any).message : String(error);
        console.log(`[Connectivity] Health check error: ${errName} - ${errMsg}`);
      } catch (e) {
        console.log('[Connectivity] Health check error (unknown)', error);
      }

      // Em caso de erro de rede (DNS, Timeout), mantemos o estado anterior por um tempo
      // para evitar que a interface fique piscando "Offline"
      // notifyListeners(false); // Removido o aviso agressivo
    }
  };

  // Verifica a cada 30 segundos em vez de 10
  const interval = setInterval(checkConnectivity, 30000);
  checkConnectivity();

  return () => clearInterval(interval);
}

export async function initConnectivityMonitoring() {
  if (unsubscribeInterval) {
    unsubscribeInterval();
  }
  unsubscribeInterval = initConnectivityCheck();
  return unsubscribeInterval;
}

export function isNetworkOnline(): boolean {
  return isOnline;
}

export function subscribeToConnectivityChanges(
  callback: (online: boolean) => void,
): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

function notifyListeners(online: boolean) {
  listeners.forEach(callback => {
    try {
      callback(online);
    } catch (error) {
      console.error('[Connectivity] Error in listener:', error);
    }
  });
}