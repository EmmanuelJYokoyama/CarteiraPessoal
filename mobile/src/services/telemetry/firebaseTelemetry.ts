import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

const TELEMETRY_CONSENT_KEY = '@telemetry_consent';
const TELEMETRY_ERROR_LOG_KEY = '@telemetry_error_log';
const MAX_ERROR_LOGS = 25;

export type TelemetryEventParams = Record<string, string | number | boolean | null | undefined>;

export type TelemetryFlowStatus = 'success' | 'failure' | 'cancelled';

export type TelemetryBackupAction = 'sign_in' | 'sign_out' | 'upload' | 'download' | 'restore';

export type TelemetryAuthAction = 'password_login' | 'pin_login' | 'token_refresh';

export type TelemetryTransactionAction = 'create' | 'update' | 'delete' | 'sync';

export type TelemetrySyncAction = 'sync_pending_requests';

export type TelemetryErrorEntry = {
  id: string;
  message: string;
  stack: string | null;
  timestamp: string;
  fatal: boolean;
  context: Record<string, string>;
};

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;

let isInitialized = false;
let previousGlobalHandler: GlobalErrorHandler | null = null;

function hasNativeFirebaseApp(): boolean {
  return firebase.apps.length > 0;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getErrorUtils(): {getGlobalHandler?: () => GlobalErrorHandler | null; setGlobalHandler?: (handler: GlobalErrorHandler) => void} | null {
  const errorUtils = (globalThis as typeof globalThis & {
    ErrorUtils?: {getGlobalHandler?: () => GlobalErrorHandler | null; setGlobalHandler?: (handler: GlobalErrorHandler) => void};
  }).ErrorUtils;

  return errorUtils ?? null;
}

async function readBooleanValue(key: string, defaultValue: boolean): Promise<boolean> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }

  return value === 'true';
}

async function persistBooleanValue(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? 'true' : 'false');
}

async function updateNativeCollection(enabled: boolean): Promise<void> {
  if (!hasNativeFirebaseApp()) {
    return;
  }

  try {
    await Promise.all([
      analytics().setAnalyticsCollectionEnabled(enabled),
      crashlytics().setCrashlyticsCollectionEnabled(enabled),
    ]);
  } catch (error) {
    console.error('[Telemetry] Failed to update native collection settings', error);
  }
}

async function getNativeConsent(): Promise<boolean> {
  return readBooleanValue(TELEMETRY_CONSENT_KEY, false);
}

export async function initializeTelemetry(): Promise<boolean> {
  if (isInitialized) {
    return getTelemetryConsent();
  }

  isInitialized = true;

  const consent = await getNativeConsent();
  await updateNativeCollection(consent);
  await setTelemetryUserContext();
  installGlobalErrorHandler();

  return consent;
}

export async function getTelemetryConsent(): Promise<boolean> {
  return readBooleanValue(TELEMETRY_CONSENT_KEY, false);
}

export async function setTelemetryConsent(enabled: boolean): Promise<void> {
  await persistBooleanValue(TELEMETRY_CONSENT_KEY, enabled);
  await updateNativeCollection(enabled);

  if (!enabled) {
    await clearTelemetryUserContext();
  } else {
    await setTelemetryUserContext();
  }
}

export async function setTelemetryUserId(userId: string | null): Promise<void> {
  if (!hasNativeFirebaseApp()) {
    console.debug('[Telemetry] Firebase not initialized, skipping setTelemetryUserId');
    return;
  }

  const consent = await getTelemetryConsent();
  if (!consent) {
    return;
  }

  try {
    if (userId) {
      await Promise.all([
        analytics().setUserId(userId),
        crashlytics().setUserId(userId),
      ]);
    } else {
      await clearTelemetryUserContext();
    }
  } catch (error) {
    console.error('[Telemetry] Failed to set user id', error);
  }
}

export async function logEvent(name: string, params: TelemetryEventParams = {}): Promise<void> {
  if (!hasNativeFirebaseApp()) {
    console.debug('[Telemetry] Firebase not initialized, skipping logEvent', name);
    return;
  }

  const consent = await getTelemetryConsent();
  if (!consent) {
    return;
  }

  try {
    await analytics().logEvent(
      name,
      Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
      ) as Record<string, string | number | boolean>,
    );
  } catch (error) {
    console.error('[Telemetry] Failed to log analytics event', error);
  }
}

export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  await logEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass ?? screenName,
  });
}

export async function logAuthEvent(
  action: TelemetryAuthAction,
  status: TelemetryFlowStatus,
  params: TelemetryEventParams = {},
): Promise<void> {
  await logEvent(`auth_${action}`, {status, ...params});
}

export async function logBackupEvent(
  action: TelemetryBackupAction,
  status: TelemetryFlowStatus,
  params: TelemetryEventParams = {},
): Promise<void> {
  await logEvent(`backup_${action}`, {status, ...params});
}

export async function logTransactionEvent(
  action: TelemetryTransactionAction,
  status: TelemetryFlowStatus,
  params: TelemetryEventParams = {},
): Promise<void> {
  await logEvent(`transaction_${action}`, {status, ...params});
}

export async function logSyncEvent(
  action: TelemetrySyncAction,
  status: TelemetryFlowStatus,
  params: TelemetryEventParams = {},
): Promise<void> {
  await logEvent(action, {status, ...params});
}

export async function logTelemetryConsentChange(enabled: boolean): Promise<void> {
  await logEvent('telemetry_consent_changed', {enabled});
}

export async function recordError(error: unknown, context: Record<string, string> = {}, fatal = false): Promise<void> {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const consent = await getTelemetryConsent();

  const entry: TelemetryErrorEntry = {
    id: createId(),
    message: normalizedError.message,
    stack: normalizedError.stack ?? null,
    timestamp: new Date().toISOString(),
    fatal,
    context,
  };

  try {
    const existing = await getRecentTelemetryErrors();
    const nextEntries = [entry, ...existing].slice(0, MAX_ERROR_LOGS);
    await AsyncStorage.setItem(TELEMETRY_ERROR_LOG_KEY, JSON.stringify(nextEntries));
  } catch (storageError) {
    console.error('[Telemetry] Failed to persist local error log', storageError);
  }

  if (!hasNativeFirebaseApp()) {
    console.debug('[Telemetry] Firebase not initialized, skipping recordError');
    return;
  }

  if (!consent) {
    return;
  }

  try {
    await crashlytics().recordError(normalizedError);
    await crashlytics().setAttributes({
      fatal: String(fatal),
      ...context,
    });
  } catch (telemetryError) {
    console.error('[Telemetry] Failed to send error to Crashlytics', telemetryError);
  }
}

export async function getRecentTelemetryErrors(): Promise<TelemetryErrorEntry[]> {
  const rawValue = await AsyncStorage.getItem(TELEMETRY_ERROR_LOG_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as TelemetryErrorEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export async function clearRecentTelemetryErrors(): Promise<void> {
  await AsyncStorage.removeItem(TELEMETRY_ERROR_LOG_KEY);
}

function installGlobalErrorHandler(): void {
  const errorUtils = getErrorUtils();
  if (!errorUtils?.setGlobalHandler || previousGlobalHandler) {
    return;
  }

  previousGlobalHandler = errorUtils.getGlobalHandler?.() ?? null;

  errorUtils.setGlobalHandler((error, isFatal) => {
    void recordError(error, {source: 'global'}, Boolean(isFatal));
    previousGlobalHandler?.(error, isFatal);
  });
}

async function setTelemetryUserContext(): Promise<void> {
  const consent = await getTelemetryConsent();
  if (!consent) {
    return;
  }

  try {
    const userData = await AsyncStorage.getItem('@user_data');
    if (!userData) {
      return;
    }

    const user = JSON.parse(userData) as {email?: string};
    const userId = user.email ?? null;
    if (userId) {
      await setTelemetryUserId(userId);
    }
  } catch (error) {
    console.error('[Telemetry] Failed to restore user context', error);
  }
}

async function clearTelemetryUserContext(): Promise<void> {
  if (!hasNativeFirebaseApp()) {
    return;
  }

  try {
    await Promise.all([
      analytics().resetAnalyticsData(),
      crashlytics().setUserId(''),
    ]);
  } catch (error) {
    console.error('[Telemetry] Failed to clear telemetry user context', error);
  }
}
