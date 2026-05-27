import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {authorize, refresh, type AuthConfiguration, type AuthorizeResult} from 'react-native-app-auth';
import {createEncryptedAppBackup, restoreEncryptedAppBackup, type AppBackupRestoreResult} from './appBackup';
import {
  GOOGLE_DRIVE_BACKUP_FILE_PREFIX,
  GOOGLE_DRIVE_BACKUP_FOLDER_NAME,
  GOOGLE_DRIVE_REDIRECT_URL,
  GOOGLE_DRIVE_SCOPE,
  GOOGLE_DRIVE_SESSION_SERVICE,
  GOOGLE_DRIVE_WEB_CLIENT_ID,
  isGoogleDriveConfigReady,
} from '@config/googleDrive';
import {logBackupEvent} from '@services/telemetry/firebaseTelemetry';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const SESSION_REFRESH_THRESHOLD_MS = 60_000;

export type GoogleDriveBackupSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpirationDate: string;
  idToken?: string;
  tokenType?: string;
  accountEmail?: string;
  folderId: string;
  folderName: string;
};

export type GoogleDriveBackupSummary = {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
};

export class GoogleDriveBackupError extends Error {
  constructor(
    public readonly code:
      | 'GOOGLE_DRIVE_CONFIG_MISSING'
      | 'GOOGLE_DRIVE_AUTH_FAILED'
      | 'GOOGLE_DRIVE_SESSION_MISSING'
      | 'GOOGLE_DRIVE_UPLOAD_FAILED'
      | 'GOOGLE_DRIVE_DOWNLOAD_FAILED'
      | 'GOOGLE_DRIVE_RESTORE_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'GoogleDriveBackupError';
  }
}

const AUTH_CONFIG: AuthConfiguration = {
  clientId: GOOGLE_DRIVE_WEB_CLIENT_ID,
  redirectUrl: GOOGLE_DRIVE_REDIRECT_URL,
  scopes: ['openid', 'email', 'profile', GOOGLE_DRIVE_SCOPE],
  serviceConfiguration: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
    revocationEndpoint: GOOGLE_REVOKE_ENDPOINT,
  },
  additionalParameters: {
    access_type: 'offline',
    prompt: 'consent',
  },
};

type StoredSession = GoogleDriveBackupSession & {
  storedAt: string;
};

function assertGoogleDriveConfig(): void {
  if (!isGoogleDriveConfigReady()) {
    throw new GoogleDriveBackupError(
      'GOOGLE_DRIVE_CONFIG_MISSING',
      'Google Drive OAuth client id is not configured.',
    );
  }
}

function hasExpired(expirationDate: string): boolean {
  const expiresAt = new Date(expirationDate).getTime();
  return Number.isNaN(expiresAt) || expiresAt - Date.now() <= SESSION_REFRESH_THRESHOLD_MS;
}

function buildBearerHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function requestJson<T>(url: string, token: string, init?: RequestInit, retryCount = 0): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...buildBearerHeaders(token),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 && retryCount === 0) {
    const refreshedSession = await refreshStoredSession();
    return requestJson<T>(url, refreshedSession.accessToken, init, retryCount + 1);
  }

  if (!response.ok) {
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_UPLOAD_FAILED', `Google Drive request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchWithRetry(url: string, token: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...buildBearerHeaders(token),
          ...(init?.headers ?? {}),
        },
      });

      if (response.status === 401 && attempt === 0) {
        const refreshedSession = await refreshStoredSession();
        token = refreshedSession.accessToken;
        continue;
      }

      if (!response.ok && response.status >= 500 && attempt < 2) {
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new GoogleDriveBackupError('GOOGLE_DRIVE_UPLOAD_FAILED', 'Unable to complete Google Drive request');
}

async function saveSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword('google-drive', JSON.stringify(session), {
    service: GOOGLE_DRIVE_SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function readStoredSession(): Promise<StoredSession | null> {
  const credentials = await Keychain.getGenericPassword({service: GOOGLE_DRIVE_SESSION_SERVICE});
  if (!credentials) {
    return null;
  }

  try {
    return JSON.parse(credentials.password) as StoredSession;
  } catch {
    return null;
  }
}

async function clearStoredSession(): Promise<void> {
  await Keychain.resetGenericPassword({service: GOOGLE_DRIVE_SESSION_SERVICE});
}

async function ensureSession(): Promise<StoredSession> {
  const storedSession = await readStoredSession();
  if (!storedSession) {
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_SESSION_MISSING', 'No Google Drive session is available.');
  }

  if (!hasExpired(storedSession.accessTokenExpirationDate)) {
    return storedSession;
  }

  return refreshStoredSession();
}

async function refreshStoredSession(): Promise<StoredSession> {
  const storedSession = await readStoredSession();
  if (!storedSession) {
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_SESSION_MISSING', 'No Google Drive session is available.');
  }

  const refreshed = await refresh(AUTH_CONFIG, {
    refreshToken: storedSession.refreshToken,
  });

  const nextSession: StoredSession = {
    ...storedSession,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? storedSession.refreshToken,
    accessTokenExpirationDate: refreshed.accessTokenExpirationDate ?? new Date(Date.now() + 55 * 60 * 1000).toISOString(),
    idToken: refreshed.idToken ?? storedSession.idToken,
    tokenType: refreshed.tokenType ?? storedSession.tokenType,
    storedAt: new Date().toISOString(),
  };

  await saveSession(nextSession);
  return nextSession;
}

async function exchangeAuthResult(result: AuthorizeResult): Promise<StoredSession> {
  if (!result.refreshToken) {
    throw new GoogleDriveBackupError(
      'GOOGLE_DRIVE_AUTH_FAILED',
      'Google authorization did not return a refresh token. Ensure offline access and consent are enabled.',
    );
  }

  const accessTokenExpirationDate = result.accessTokenExpirationDate ?? new Date(Date.now() + 55 * 60 * 1000).toISOString();

  const session: StoredSession = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpirationDate,
    idToken: result.idToken,
    tokenType: result.tokenType,
    accountEmail: result.additionalParameters?.email,
    folderId: '',
    folderName: GOOGLE_DRIVE_BACKUP_FOLDER_NAME,
    storedAt: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
}

async function ensureBackupFolder(session: StoredSession): Promise<StoredSession> {
  if (session.folderId) {
    return session;
  }

  const query = new URLSearchParams({
    q: `name='${GOOGLE_DRIVE_BACKUP_FOLDER_NAME}' and mimeType='${DRIVE_FOLDER_MIME_TYPE}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });

  const response = await requestJson<{files: Array<{id: string; name: string}>}>(
    `${GOOGLE_DRIVE_API_BASE}/files?${query.toString()}`,
    session.accessToken,
  );

  let folderId = response.files[0]?.id;

  if (!folderId) {
    const createResponse = await fetchWithRetry(`${GOOGLE_DRIVE_API_BASE}/files?fields=id`, session.accessToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: GOOGLE_DRIVE_BACKUP_FOLDER_NAME,
        mimeType: DRIVE_FOLDER_MIME_TYPE,
      }),
    });

    if (!createResponse.ok) {
      throw new GoogleDriveBackupError('GOOGLE_DRIVE_UPLOAD_FAILED', 'Unable to create the Google Drive backup folder.');
    }

    const folderData = (await createResponse.json()) as {id: string};
    folderId = folderData.id;
  }

  const nextSession: StoredSession = {
    ...session,
    folderId,
  };

  await saveSession(nextSession);
  return nextSession;
}

function buildMultipartBody(metadata: Record<string, unknown>, backupBody: string): {body: string; boundary: string} {
  const boundary = `----carteira-backup-${Date.now()}`;
  const lines = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    backupBody,
    `--${boundary}--`,
    '',
  ];

  return {
    boundary,
    body: lines.join('\r\n'),
  };
}

export async function getStoredGoogleDriveSession(): Promise<GoogleDriveBackupSession | null> {
  const session = await readStoredSession();
  return session ? session : null;
}

export async function signInToGoogleDrive(): Promise<GoogleDriveBackupSession> {
  assertGoogleDriveConfig();

  try {
    const authorizationResult = await authorize(AUTH_CONFIG);
    const session = await exchangeAuthResult(authorizationResult);
    const sessionWithFolder = await ensureBackupFolder(session);

    void logBackupEvent('sign_in', 'success', {
      has_folder: Boolean(sessionWithFolder.folderId),
    });

    return sessionWithFolder;
  } catch (error) {
    void logBackupEvent('sign_in', 'failure', {
      error_message: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
    throw error;
  }
}

export async function signOutFromGoogleDrive(): Promise<void> {
  const session = await readStoredSession();

  if (session) {
    try {
      await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(session.refreshToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch {
      // Revoke is best-effort; the local session still needs to be cleared.
    }
  }

  await clearStoredSession();
  void logBackupEvent('sign_out', 'success');
}

export async function uploadEncryptedBackupToGoogleDrive(password: string): Promise<GoogleDriveBackupSummary> {
  try {
    const session = await ensureBackupFolder(await ensureSession());
    const encryptedBackup = await createEncryptedAppBackup(password, {
      destination: 'google-drive',
    });
    const fileName = `${GOOGLE_DRIVE_BACKUP_FILE_PREFIX}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const multipart = buildMultipartBody(
      {
        name: fileName,
        parents: [session.folderId],
        mimeType: 'application/json',
      },
      encryptedBackup,
    );

    const response = await fetchWithRetry(
      `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink`,
      session.accessToken,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${multipart.boundary}`,
        },
        body: multipart.body,
      },
    );

    if (!response.ok) {
      throw new GoogleDriveBackupError('GOOGLE_DRIVE_UPLOAD_FAILED', 'Unable to upload the encrypted backup to Google Drive.');
    }

    const summary = (await response.json()) as GoogleDriveBackupSummary;
    void logBackupEvent('upload', 'success', {file_name: summary.name});
    return summary;
  } catch (error) {
    void logBackupEvent('upload', 'failure', {
      error_message: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
    throw error;
  }
}

export async function listGoogleDriveBackups(): Promise<GoogleDriveBackupSummary[]> {
  const session = await ensureBackupFolder(await ensureSession());
  const query = new URLSearchParams({
    q: `'${session.folderId}' in parents and trashed=false and name contains '${GOOGLE_DRIVE_BACKUP_FILE_PREFIX}'`,
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,modifiedTime,webViewLink)',
    pageSize: '20',
  });

  const response = await requestJson<{files: GoogleDriveBackupSummary[]}>(
    `${GOOGLE_DRIVE_API_BASE}/files?${query.toString()}`,
    session.accessToken,
  );

  return response.files;
}

export async function downloadLatestEncryptedBackupFromGoogleDrive(): Promise<string> {
  const backups = await listGoogleDriveBackups();
  const latestBackup = backups[0];

  if (!latestBackup) {
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_DOWNLOAD_FAILED', 'No backup was found in Google Drive.');
  }

  void logBackupEvent('download', 'success', {file_name: latestBackup.name});
  return downloadEncryptedBackupFromGoogleDrive(latestBackup.id);
}

export async function downloadEncryptedBackupFromGoogleDrive(fileId: string): Promise<string> {
  const session = await ensureSession();
  const response = await fetchWithRetry(
    `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`,
    session.accessToken,
  );

  if (!response.ok) {
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_DOWNLOAD_FAILED', 'Unable to download the encrypted backup from Google Drive.');
  }

  const backupBody = await response.text();
  void logBackupEvent('download', 'success', {file_id: fileId});
  return backupBody;
}

export async function restoreLatestBackupFromGoogleDrive(password: string): Promise<AppBackupRestoreResult> {
  try {
    const backup = await downloadLatestEncryptedBackupFromGoogleDrive();
    const result = await restoreEncryptedAppBackup(backup, password);
    void logBackupEvent('restore', 'success');
    return result;
  } catch (error) {
    void logBackupEvent('restore', 'failure', {
      error_message: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
    throw new GoogleDriveBackupError('GOOGLE_DRIVE_RESTORE_FAILED', error instanceof Error ? error.message : 'Unable to restore Google Drive backup.');
  }
}

export async function clearGoogleDriveBackupState(): Promise<void> {
  await clearStoredSession();
  await AsyncStorage.removeItem('@google_drive_backup_folder');
}
