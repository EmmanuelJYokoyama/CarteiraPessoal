import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, FlatList, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Lock, Info, Package, ChevronRight, ShieldAlert, FileWarning, Cloud} from 'lucide-react-native';
import {getTelemetryConsent, setTelemetryConsent, logTelemetryConsentChange} from '@services/telemetry/firebaseTelemetry';
import {useOfflineSync} from '@hooks/useOfflineSync';
import {styles} from './styles/SettingsScreen.styles';

type Props = NativeStackScreenProps<any, 'Settings'>;

interface SettingsItem {
  id: string;
  title: string;
  icon: React.ComponentType<{size: number; color: string}>;
  screen: string | null;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {id: '1', title: 'Configurar PIN', icon: Lock, screen: 'SetPin'},
  {id: '2', title: 'Sobre', icon: Info, screen: null},
  {id: '3', title: 'Versão', icon: Package, screen: null},
  {id: '4', title: 'Telemetry dashboard', icon: FileWarning, screen: 'TelemetryDiagnostics'},
  {id: '5', title: 'Backup na nuvem', icon: Cloud, screen: 'BackupSettings'},
];

export default function SettingsScreen({navigation}: Props) {
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [isSavingTelemetry, setIsSavingTelemetry] = useState(false);

  useEffect(() => {
    const loadTelemetryConsent = async () => {
      const consent = await getTelemetryConsent();
      setTelemetryEnabled(consent);
    };

    loadTelemetryConsent().catch(error => {
      console.error('[SettingsScreen] Failed to load telemetry consent', error);
    });
  }, []);

  const handleItemPress = (item: SettingsItem) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const handleTelemetryToggle = async () => {
    setIsSavingTelemetry(true);
    try {
      const nextValue = !telemetryEnabled;
      await setTelemetryConsent(nextValue);
      void logTelemetryConsentChange(nextValue);
      setTelemetryEnabled(nextValue);
    } finally {
      setIsSavingTelemetry(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <FlatList
        data={SETTINGS_ITEMS}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({item}) => (
          <Pressable
            style={styles.settingItem}
            onPress={() => handleItemPress(item)}>
            <View style={styles.settingIcon}>
              <item.icon size={20} color="#fff" />
            </View>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.screen && <ChevronRight size={20} color="#999" />}
          </Pressable>
        )}
      />

      <View style={styles.telemetryCard}>
        <View style={styles.telemetryHeader}>
          <View style={styles.telemetryIcon}>
            <ShieldAlert size={20} color="#fff" />
          </View>
          <View style={styles.telemetryTextBlock}>
            <Text style={styles.telemetryTitle}>Crashlytics and Analytics</Text>
            <Text style={styles.telemetryDescription}>
              Send crash reports and usage events only when you allow it.
            </Text>
          </View>
          <Switch
            value={telemetryEnabled}
            onValueChange={handleTelemetryToggle}
            disabled={isSavingTelemetry}
            trackColor={{false: '#334155', true: '#0f766e'}}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Offline sync card moved from Home */}
      <OfflineSyncCard />
    </View>
  );
}

function OfflineSyncCard() {
  const {isOnline, isSyncing, lastSyncTime, syncError, pendingRequestsCount, sync} = useOfflineSync({monitorConnectivity: false});

  return (
    <View style={[styles.telemetryCard, {marginTop: 16}] }>
      <View style={styles.telemetryHeader}>
        <View style={styles.telemetryIcon}>
          <Cloud size={20} color="#fff" />
        </View>
        <View style={styles.telemetryTextBlock}>
          <Text style={styles.telemetryTitle}>Offline Sync</Text>
          <Text style={styles.telemetryDescription}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        <View style={{justifyContent: 'center'}}>
          <Text style={{color: '#94a3b8', fontSize: 12}}>{isSyncing ? 'Sincronizando' : pendingRequestsCount > 0 ? `${pendingRequestsCount} pendência(s)` : 'Tudo em dia'}</Text>
        </View>
      </View>

      <Text style={{color: '#94a3b8', marginTop: 12}}>
        {lastSyncTime ? `Última sincronização em ${lastSyncTime.toLocaleString('pt-BR')}` : 'Nenhuma sincronização confirmada ainda.'}
      </Text>

      {!!syncError && <Text style={{color: '#ff6b6b', marginTop: 8}}>{syncError}</Text>}

      <Pressable
        style={{
          marginTop: 12,
          backgroundColor: '#10b981',
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={() => void sync()}
        disabled={isSyncing}
      >
        <Text style={{color: '#fff', fontWeight: '700'}}>{isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}</Text>
      </Pressable>
    </View>
  );
}
