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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      console.log(`[Connectivity] Checking health at ${HEALTH_URL}`);
      const response = await fetch(HEALTH_URL, {signal: controller.signal});
      clearTimeout(timeout);

      const wasOnline = isOnline;
      isOnline = response.ok;

      console.log(`[Connectivity] Health check response: ${response.status}, Online: ${isOnline}`);

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

      // Se falhou o acesso ao localhost, assumimos que estamos offline ou o servidor caiu
      if (isOnline) {
        isOnline = false;
        console.log('[Connectivity] Online: false');
        notifyListeners(false);
      }
    }
  };

  const interval = setInterval(checkConnectivity, 10000);
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