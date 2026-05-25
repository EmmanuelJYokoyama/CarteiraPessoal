import {useEffect, useState, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnectivityMonitoring,
  isNetworkOnline,
  subscribeToConnectivityChanges,
} from '@services/connectivity';
import {syncPendingRequests} from '@services/api/client';
import {getPendingRequests} from '@services/cache';

const LAST_SUCCESSFUL_SYNC_KEY = '@offline_sync:last_successful_sync';

interface UseOfflineSyncOptions {
  monitorConnectivity?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncError?: string;
  pendingRequestsCount: number;
}

type SyncStatusListener = (status: SyncStatus) => void;

const initialSyncStatus: SyncStatus = {
  isOnline: isNetworkOnline(),
  isSyncing: false,
  pendingRequestsCount: 0,
};

let sharedSyncStatus: SyncStatus = initialSyncStatus;
const syncStatusListeners = new Set<SyncStatusListener>();
let connectivityMonitorCleanup: (() => void) | null = null;
let hydrationPromise: Promise<void> | null = null;

function emitSyncStatus(nextStatus: SyncStatus) {
  sharedSyncStatus = nextStatus;
  syncStatusListeners.forEach(listener => {
    try {
      listener(sharedSyncStatus);
    } catch (error) {
      console.error('[useOfflineSync] Listener error', error);
    }
  });
}

function updateSyncStatus(
  updater: (current: SyncStatus) => SyncStatus,
) {
  emitSyncStatus(updater(sharedSyncStatus));
}

function subscribeToSharedStatus(listener: SyncStatusListener) {
  syncStatusListeners.add(listener);
  listener(sharedSyncStatus);

  return () => {
    syncStatusListeners.delete(listener);
  };
}

async function hydrateSharedStatus() {
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    try {
      const [pendingRequests, lastSuccessfulSync] = await Promise.all([
        getPendingRequests(),
        AsyncStorage.getItem(LAST_SUCCESSFUL_SYNC_KEY),
      ]);

      updateSyncStatus(prev => ({
        ...prev,
        pendingRequestsCount: pendingRequests.length,
        lastSyncTime: lastSuccessfulSync ? new Date(lastSuccessfulSync) : prev.lastSyncTime,
      }));
    } catch (error) {
      console.error('[useOfflineSync] Failed to hydrate sync status', error);
    }
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

async function startConnectivityMonitoringOnce(onOnline: () => Promise<void>) {
  if (connectivityMonitorCleanup) {
    return connectivityMonitorCleanup;
  }

  connectivityMonitorCleanup = await initConnectivityMonitoring();

  const unsubscribeListener = subscribeToConnectivityChanges(async online => {
    updateSyncStatus(prev => ({
      ...prev,
      isOnline: online,
    }));

    if (online) {
      await onOnline();
    }
  });

  return () => {
    unsubscribeListener();
    connectivityMonitorCleanup?.();
    connectivityMonitorCleanup = null;
  };
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const {monitorConnectivity = true} = options;
  const [status, setStatus] = useState<SyncStatus>(sharedSyncStatus);

  useEffect(() => subscribeToSharedStatus(setStatus), []);

  const performSync = useCallback(async () => {
    if (!isNetworkOnline()) {
      console.log('[useOfflineSync] Skipping sync - still offline');
      return;
    }

    updateSyncStatus(prev => ({...prev, isSyncing: true, syncError: undefined}));

    try {
      const result = await syncPendingRequests();
      console.log('[useOfflineSync] Sync result:', result);

      const pendingRequests = await getPendingRequests();
      await AsyncStorage.setItem(LAST_SUCCESSFUL_SYNC_KEY, new Date().toISOString());

      updateSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        syncError: result.failed > 0 ? `${result.failed} requests failed` : undefined,
        pendingRequestsCount: pendingRequests.length,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useOfflineSync] Sync failed:', errorMessage);

      const pendingRequests = await getPendingRequests();

      updateSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
        pendingRequestsCount: pendingRequests.length,
      }));
    }
  }, []);

  useEffect(() => {
    void hydrateSharedStatus();
  }, []);

  useEffect(() => {
    if (!monitorConnectivity) {
      return undefined;
    }

    let cancelled = false;
    let cleanupMonitor: (() => void) | null = null;

    void startConnectivityMonitoringOnce(async () => {
      if (cancelled) {
        return;
      }

      await performSync();
    }).then(cleanup => {
      cleanupMonitor = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupMonitor?.();
    };
  }, [monitorConnectivity, performSync]);

  return {
    ...status,
    sync: performSync,
  };
}
