import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Slider,
} from 'react-native';
import {Bell, Save, Loader} from 'lucide-react-native';
import {apiRequest} from '@services/api/client';
import {styles} from './styles/CardLimitAlertConfig.styles';

interface CardLimitAlert {
  cardId: string;
  cardName: string;
  limit: number;
  usedAmount: number;
  usedPercentage: number;
  alertPercentage: number;
  alertEnabled: boolean;
}

interface CardLimitAlertConfigProps {
  cardId: string;
  cardName: string;
  onSuccess?: () => void;
}

export function CardLimitAlertConfig({
  cardId,
  cardName,
  onSuccess,
}: CardLimitAlertConfigProps) {
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState<CardLimitAlert | null>(null);
  const [alertPercentage, setAlertPercentage] = useState(80);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAlertConfig();
  }, []);

  async function loadAlertConfig() {
    try {
      setLoading(true);
      const response = await apiRequest<CardLimitAlert>(
        `/cards/${cardId}/limit-status`,
        {method: 'GET'}
      );
      setAlertData(response);
      setAlertPercentage(response.alertPercentage);
      setAlertEnabled(response.alertEnabled);
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePercentage() {
    try {
      setSaving(true);
      await apiRequest(`/cards/${cardId}/alert-percentage`, {
        method: 'PATCH',
        body: {alertPercentage},
      });

      Alert.alert('Sucesso', 'Percentual de alerta atualizado!');
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAlert() {
    try {
      setSaving(true);
      const newValue = !alertEnabled;
      setAlertEnabled(newValue);

      await apiRequest(`/cards/${cardId}/alert-enabled`, {
        method: 'PATCH',
        body: {enabled: newValue},
      });

      onSuccess?.();
    } catch (error: any) {
      setAlertEnabled(!alertEnabled);
      Alert.alert('Erro', error.message || 'Falha ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckAlerts() {
    try {
      setSaving(true);
      const response = await apiRequest('/cards/check-alerts', {
        method: 'POST',
      });

      Alert.alert(
        'Verificação concluída',
        `${response.notificationsChecked} alerta(s) verificado(s)`
      );
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao verificar alertas');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </View>
    );
  }

  if (!alertData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Falha ao carregar configurações</Text>
      </View>
    );
  }

  const percentageUsed = alertData.usedPercentage;
  const statusColor =
    percentageUsed >= alertPercentage
      ? '#ef4444'
      : percentageUsed >= alertPercentage * 0.75
      ? '#f59e0b'
      : '#10b981';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Bell size={28} color="#3b82f6" />
          <View>
            <Text style={styles.title}>Alerta de Limite</Text>
            <Text style={styles.subtitle}>{cardName}</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, {borderLeftColor: statusColor}]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Limite:</Text>
            <Text style={styles.statusValue}>R$ {alertData.limit.toFixed(2)}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Utilizado:</Text>
            <Text style={[styles.statusValue, {color: statusColor}]}>
              R$ {alertData.usedAmount.toFixed(2)} ({percentageUsed.toFixed(1)}%)
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentageUsed, 100)}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Disponível:</Text>
            <Text style={styles.statusValue}>
              R$ {(alertData.limit - alertData.usedAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Alert Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ativar Notificações</Text>
            <Switch
              value={alertEnabled}
              onValueChange={handleToggleAlert}
              disabled={saving}
              trackColor={{false: '#374151', true: '#2ed573'}}
              thumbColor={alertEnabled ? '#fff' : '#9ca3af'}
            />
          </View>
          {alertEnabled && (
            <Text style={styles.sectionHint}>
              Você receberá um SMS quando o limite atingir {alertPercentage}%
            </Text>
          )}
        </View>

        {/* Percentage Slider */}
        {alertEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Percentual de Alerta</Text>

            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={100}
                step={5}
                value={alertPercentage}
                onValueChange={setAlertPercentage}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#374151"
                disabled={saving}
              />
            </View>

            <View style={styles.percentageDisplay}>
              <Text style={styles.percentageValue}>{alertPercentage}%</Text>
              <Text style={styles.percentageAlertAmount}>
                Alerta em: R$ {(alertData.limit * (alertPercentage / 100)).toFixed(2)}
              </Text>
            </View>

            <View style={styles.presetButtons}>
              {[50, 70, 80, 90].map((percentage) => (
                <Pressable
                  key={percentage}
                  style={[
                    styles.presetButton,
                    alertPercentage === percentage && styles.presetButtonActive,
                  ]}
                  onPress={() => setAlertPercentage(percentage)}>
                  <Text
                    style={[
                      styles.presetButtonText,
                      alertPercentage === percentage && styles.presetButtonTextActive,
                    ]}>
                    {percentage}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.checkButton]}
            onPress={handleCheckAlerts}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Loader size={18} color="#fff" />
                <Text style={styles.checkButtonText}>Verificar Agora</Text>
              </>
            )}
          </Pressable>

          {alertPercentage !== alertData.alertPercentage && (
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdatePercentage}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Save size={18} color="#000" />
                  <Text style={styles.saveButtonText}>Salvar Mudanças</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>ℹ️ Como funciona</Text>
          <Text style={styles.helpText}>
            Quando seu saldo atinge o percentual definido, você recebe um SMS de
            notificação com o valor utilizado e disponível do seu limite.
          </Text>
          <Text style={styles.helpText}>
            Você pode modificar o percentual a qualquer momento ou desativar as
            notificações se desejar.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
