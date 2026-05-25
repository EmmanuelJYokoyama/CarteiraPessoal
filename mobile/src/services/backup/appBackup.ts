import AsyncStorage from '@react-native-async-storage/async-storage';
import {encryptBackup, decryptBackup, serializeBackupEnvelope, type BackupMetadata} from './backupEncryption';

export type AppBackupSnapshot = {
  version: 1;
  exportedAt: string;
  storage: Record<string, string>;
};

export type AppBackupRestoreResult = {
  keysRestored: number;
};

export async function collectAppBackupSnapshot(): Promise<AppBackupSnapshot> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);

  const storage: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value !== null) {
      storage[key] = value;
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    storage,
  };
}

export async function restoreAppBackupSnapshot(snapshot: AppBackupSnapshot): Promise<AppBackupRestoreResult> {
  const entries = Object.entries(snapshot.storage);
  const currentKeys = await AsyncStorage.getAllKeys();

  if (currentKeys.length > 0) {
    await AsyncStorage.multiRemove(currentKeys);
  }

  if (entries.length > 0) {
    await AsyncStorage.multiSet(entries);
  }

  return {keysRestored: entries.length};
}

export async function createEncryptedAppBackup(password: string, metadata?: BackupMetadata): Promise<string> {
  const snapshot = await collectAppBackupSnapshot();
  const envelope = encryptBackup(snapshot, password, {
    metadata: {
      backupKind: 'app-state',
      ...metadata,
    },
  });

  return serializeBackupEnvelope(envelope);
}

export async function restoreEncryptedAppBackup(encryptedBackup: string, password: string): Promise<AppBackupRestoreResult> {
  const snapshot = decryptBackup<AppBackupSnapshot>(encryptedBackup, password);

  if (!snapshot || snapshot.version !== 1 || typeof snapshot.storage !== 'object' || snapshot.storage === null) {
    throw new Error('Invalid app backup snapshot');
  }

  return restoreAppBackupSnapshot(snapshot);
}
