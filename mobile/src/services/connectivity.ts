import {Platform} from 'react-native';

const HEALTH_URL =
  Platform.OS === 'android'
    ? 'https://carteirapessoal.onrender.com/health'
    : 'https://carteirapessoal.onrender.com/health';

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
      console.log(`[Connectivity] Health check error:`, error);
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