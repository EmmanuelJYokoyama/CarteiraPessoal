import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, FlatList, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RefreshCcw, ShieldCheck, ShieldOff, Trash2} from 'lucide-react-native';
import {
  clearRecentTelemetryErrors,
  getRecentTelemetryErrors,
  getTelemetryConsent,
  setTelemetryConsent,
  type TelemetryErrorEntry,
} from '@services/telemetry/firebaseTelemetry';
import {styles} from './styles/TelemetryDiagnosticsScreen.styles';

type Props = NativeStackScreenProps<any, 'TelemetryDiagnostics'>;

export default function TelemetryDiagnosticsScreen({navigation}: Props) {
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [errors, setErrors] = useState<TelemetryErrorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentConsent, recentErrors] = await Promise.all([
        getTelemetryConsent(),
        getRecentTelemetryErrors(),
      ]);

      setConsentEnabled(currentConsent);
      setErrors(recentErrors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleConsent = async () => {
    setIsSaving(true);
    try {
      const nextValue = !consentEnabled;
      await setTelemetryConsent(nextValue);
      setConsentEnabled(nextValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearErrors = async () => {
    await clearRecentTelemetryErrors();
    setErrors([]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Telemetry</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <FlatList
          data={errors}
          keyExtractor={item => item.id}
          ListHeaderComponent={(
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  {consentEnabled ? <ShieldCheck size={20} color="#fff" /> : <ShieldOff size={20} color="#fff" />}
                </View>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryTitle}>Crashlytics and Analytics</Text>
                  <Text style={styles.summaryDescription}>
                    {consentEnabled ? 'Enabled and sending diagnostics.' : 'Disabled until the user grants consent.'}
                  </Text>
                </View>
              </View>

              <Pressable style={styles.toggleButton} onPress={() => void handleToggleConsent()} disabled={isSaving}>
                <Text style={styles.toggleButtonText}>
                  {isSaving ? 'Saving...' : consentEnabled ? 'Disable collection' : 'Enable collection'}
                </Text>
              </Pressable>

              <Pressable style={styles.clearButton} onPress={() => void handleClearErrors()}>
                <Trash2 size={18} color="#fff" />
                <Text style={styles.clearButtonText}>Clear local error log</Text>
              </Pressable>

              <Pressable style={styles.refreshButton} onPress={() => void loadData()}>
                <RefreshCcw size={18} color="#0f766e" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No captured errors</Text>
              <Text style={styles.emptyStateDescription}>
                When the app records a runtime exception, it will appear here and be forwarded to Crashlytics when consent is enabled.
              </Text>
            </View>
          )}
          contentContainerStyle={styles.content}
          renderItem={({item}) => (
            <View style={styles.errorCard}>
              <Text style={styles.errorMessage}>{item.message}</Text>
              <Text style={styles.errorMeta}>{new Date(item.timestamp).toLocaleString()} • {item.fatal ? 'fatal' : 'non-fatal'}</Text>
              {!!item.stack && <Text style={styles.errorStack}>{item.stack}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}
