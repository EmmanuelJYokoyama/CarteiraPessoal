import {useEffect, useState, useCallback} from 'react';
import {
  initConnectivityMonitoring,
  isNetworkOnline,
  subscribeToConnectivityChanges,
} from '@services/connectivity';
import {syncPendingRequests} from '@services/api/client';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncError?: string;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: isNetworkOnline(),
    isSyncing: false,
  });

  useEffect(() => {
    // Initialize connectivity monitoring
    const unsubscribeMonitor = initConnectivityMonitoring();

    // Subscribe to connectivity changes
    const unsubscribeListener = subscribeToConnectivityChanges(async (online) => {
      setStatus(prev => ({...prev, isOnline: online}));

      // Auto-sync when coming back online
      if (online) {
        await performSync();
      }
    });

    return () => {
      unsubscribeMonitor?.then(fn => fn?.());
      unsubscribeListener?.();
    };
  }, []);

  const performSync = useCallback(async () => {
    if (!isNetworkOnline()) {
      console.log('[useOfflineSync] Skipping sync - still offline');
      return;
    }

    setStatus(prev => ({...prev, isSyncing: true, syncError: undefined}));

    try {
      const result = await syncPendingRequests();
      console.log('[useOfflineSync] Sync result:', result);

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        syncError: result.failed > 0 ? `${result.failed} requests failed` : undefined,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useOfflineSync] Sync failed:', errorMessage);

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
    }
  }, []);

  return {
    ...status,
    sync: performSync,
  };
}
