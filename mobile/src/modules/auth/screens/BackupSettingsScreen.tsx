import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Cloud, Download, LogOut, RefreshCcw, ShieldCheck, Upload} from 'lucide-react-native';
import {isGoogleDriveConfigReady} from '@config/googleDrive';
import {
  clearGoogleDriveBackupState,
  getStoredGoogleDriveSession,
  listGoogleDriveBackups,
  restoreLatestBackupFromGoogleDrive,
  signInToGoogleDrive,
  signOutFromGoogleDrive,
  uploadEncryptedBackupToGoogleDrive,
  type GoogleDriveBackupSession,
  type GoogleDriveBackupSummary,
} from '@services/backup/googleDriveBackup';
import {styles} from './styles/BackupSettingsScreen.styles';

type Props = NativeStackScreenProps<any, 'BackupSettings'>;

export default function BackupSettingsScreen({navigation}: Props) {
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<GoogleDriveBackupSession | null>(null);
  const [backups, setBackups] = useState<GoogleDriveBackupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const isConfigured = useMemo(() => isGoogleDriveConfigReady(), []);

  const loadState = async () => {
    setIsLoading(true);
    try {
      const [storedSession, storedBackups] = await Promise.all([
        getStoredGoogleDriveSession(),
        getStoredGoogleDriveSession().then(currentSession => (currentSession ? listGoogleDriveBackups() : [])),
      ]);

      setSession(storedSession);
      setBackups(storedBackups);
    } catch (error) {
      console.error('[BackupSettings] Failed to load Google Drive state', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadState().catch(error => {
      console.error('[BackupSettings] Failed to bootstrap Google Drive state', error);
    });
  }, []);

  const handleSignIn = async () => {
    setIsBusy(true);
    try {
      const nextSession = await signInToGoogleDrive();
      setSession(nextSession);
      Alert.alert('Google Drive', 'Sessão conectada com sucesso.');
    } catch (error) {
      Alert.alert('Google Drive', error instanceof Error ? error.message : 'Falha ao entrar com Google.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!password.trim()) {
      Alert.alert('Backup', 'Informe a senha de backup antes de enviar ao Drive.');
      return;
    }

    setIsBusy(true);
    try {
      await uploadEncryptedBackupToGoogleDrive(password);
      await loadState();
      Alert.alert('Backup', 'Backup criptografado enviado para o Google Drive.');
    } catch (error) {
      Alert.alert('Backup', error instanceof Error ? error.message : 'Falha ao enviar backup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!password.trim()) {
      Alert.alert('Restore', 'Informe a senha de backup para restaurar.');
      return;
    }

    setIsBusy(true);
    try {
      await restoreLatestBackupFromGoogleDrive(password);
      Alert.alert('Restore', 'Backup restaurado com sucesso. Reinicie o app para recarregar os dados.');
    } catch (error) {
      Alert.alert('Restore', error instanceof Error ? error.message : 'Falha ao restaurar backup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    try {
      await signOutFromGoogleDrive();
      await clearGoogleDriveBackupState();
      setSession(null);
      setBackups([]);
      Alert.alert('Google Drive', 'Sessão desconectada.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Backup na nuvem</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Cloud size={22} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Google Drive + AES-256</Text>
              <Text style={styles.heroDescription}>
                Crie um backup criptografado, faça upload automático para uma pasta dedicada e restaure usando a mesma senha.
              </Text>
            </View>
          </View>

          {!isConfigured && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Configuração pendente</Text>
              <Text style={styles.warningText}>
                Configure o client ID OAuth2 do Google em src/config/googleDrive.ts para habilitar o login.
              </Text>
            </View>
          )}

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Senha do backup</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Digite a senha usada na criptografia"
              placeholderTextColor="#64748b"
              style={styles.input}
            />
          </View>

          <View style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionIcon}>
                <ShieldCheck size={20} color="#fff" />
              </View>
              <View style={styles.sessionTextBlock}>
                <Text style={styles.sessionTitle}>{session ? 'Sessão conectada' : 'Sessão desconectada'}</Text>
                <Text style={styles.sessionDescription}>
                  {session ? `Pasta: ${session.folderName}` : 'Faça login com Google para habilitar o Drive.'}
                </Text>
              </View>
            </View>

            <View style={styles.actionGrid}>
              <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={!isConfigured || isBusy}>
                <Upload size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Conectar Google</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => { loadState().catch(error => console.error('[BackupSettings] Refresh failed', error)); }} disabled={isBusy}>
                <RefreshCcw size={18} color="#0f766e" />
                <Text style={styles.secondaryButtonText}>Atualizar</Text>
              </Pressable>

              <Pressable style={styles.primaryButton} onPress={handleUpload} disabled={!session || isBusy}>
                <Upload size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Enviar backup</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleRestore} disabled={!session || isBusy}>
                <Download size={18} color="#0f766e" />
                <Text style={styles.secondaryButtonText}>Restaurar último</Text>
              </Pressable>

              <Pressable style={styles.dangerButton} onPress={handleSignOut} disabled={!session || isBusy}>
                <LogOut size={18} color="#fff" />
                <Text style={styles.dangerButtonText}>Desconectar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>Backups recentes</Text>
            {backups.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum backup encontrado na pasta dedicada.</Text>
            ) : (
              backups.map(item => (
                <View key={item.id} style={styles.backupRow}>
                  <View style={styles.backupDot} />
                  <View style={styles.backupTextBlock}>
                    <Text style={styles.backupName}>{item.name}</Text>
                    <Text style={styles.backupMeta}>{new Date(item.modifiedTime).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
