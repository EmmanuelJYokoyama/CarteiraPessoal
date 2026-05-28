import React, {useMemo, useRef, useState} from 'react';
import {View, Text, Pressable, TextInput, ScrollView, Platform, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, ScanLine, CircleAlert, Camera, CameraOff} from 'lucide-react-native';
import {Camera as VisionCamera, useCameraDevice, useCameraPermission, useCodeScanner} from 'react-native-vision-camera';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {formatBoletoAmount, parseBoletoCode} from '../utils/boletoParser';

type Props = NativeStackScreenProps<any, 'BoletoScanner'>;
type ScannerResult = ReturnType<typeof parseBoletoCode>;

function formatDate(date: string | null) {
  if (!date) {
    return 'Não identificada';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T00:00:00`));
}

export default function BoletoScannerScreen({navigation}: Props) {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState<ScannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const supportedFormats = useMemo(() => ['ITF', 'CODE_128'], []);

  const codeScanner = useCodeScanner({
    codeTypes: ['itf', 'code-128', 'ean-13', 'ean-8', 'upc-a', 'upc-e'],
    onCodeScanned: codes => {
      const scannedValue = codes[0]?.value;
      if (!scannedValue || scannedValue === lastScanRef.current) {
        return;
      }

      lastScanRef.current = scannedValue;
      handleParsedValue(scannedValue);
    },
  });

  function handleParsedValue(value: string) {
    try {
      const parsed = parseBoletoCode(value);
      setResult(parsed);
      setError(parsed.isValid ? null : 'Código identificado, mas com DV inconsistente.');
      return parsed;
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Não foi possível interpretar o boleto.';
      setResult(null);
      setError(message);
      return null;
    }
  }

  const handleManualParse = () => {
    if (!manualInput.trim()) {
      setError('Digite ou cole uma linha digitável/código de barras.');
      return;
    }

    handleParsedValue(manualInput);
  };

  const enableCamera = async () => {
    setError(null);
    const granted = hasPermission || (await requestPermission());
    if (!granted) {
      setError('Permissão de câmera negada.');
      setCameraActive(false);
      return;
    }

    if (!device) {
      setError('Nenhuma câmera traseira disponível neste dispositivo.');
      setCameraActive(false);
      return;
    }

    setCameraActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={18} color="#fff" />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Leitor de boleto</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <ScanLine size={26} color="#0f172a" />
          </View>
          <Text style={styles.heroTitle}>Leitura e parsing de boleto</Text>
          <Text style={styles.heroDescription}>
            Use a câmera para capturar o código de barras ou cole a linha digitável para interpretar valor e vencimento.
          </Text>
          <Text style={styles.heroMeta}>Formatos ZXing suportados: {supportedFormats.join(', ')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrada manual</Text>
          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Cole a linha digitável ou o código de barras"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType={Platform.OS === 'android' ? 'numeric' : 'number-pad'}
            style={styles.input}
          />
          <Pressable style={styles.primaryButton} onPress={handleManualParse}>
            <Text style={styles.primaryButtonText}>Interpretar boleto</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Câmera</Text>
          {!cameraActive ? (
            <Pressable style={styles.secondaryButton} onPress={enableCamera}>
              <Camera size={18} color="#fff" />
              <Text style={styles.secondaryButtonText}>Ativar câmera</Text>
            </Pressable>
          ) : device ? (
            <View style={styles.cameraWrapper}>
              <VisionCamera
                style={styles.camera}
                device={device}
                isActive={cameraActive}
                codeScanner={codeScanner}
                photo={false}
              />
            </View>
          ) : (
            <View style={styles.cameraUnavailableCard}>
              <CameraOff size={22} color="#cbd5e1" />
              <Text style={styles.cameraUnavailableTitle}>Câmera indisponível</Text>
              <Text style={styles.cameraUnavailableText}>
                Não foi possível iniciar a câmera traseira deste aparelho.
              </Text>
            </View>
          )}
          <Text style={styles.cameraHint}>
            Aponte para um boleto com código de barras. Se preferir, cole a linha digitável no campo acima.
          </Text>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <CircleAlert size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Resultado</Text>
            <ResultRow label="Linha digitável" value={result.digitableLine} />
            <ResultRow label="Código de barras" value={result.barcode} />
            <ResultRow label="Valor" value={formatBoletoAmount(result.amount)} />
            <ResultRow label="Vencimento" value={formatDate(result.dueDate)} />
            <ResultRow label="Validação" value={result.isValid ? 'OK' : 'Atenção: DV inválido'} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#020617'},
  header: {paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  backButton: {flexDirection: 'row', alignItems: 'center', gap: 8},
  backText: {color: '#fff', fontWeight: '700'},
  title: {flex: 1, color: '#fff', fontSize: 20, fontWeight: '800'},
  content: {padding: 16, gap: 12},
  heroCard: {backgroundColor: '#e2e8f0', borderRadius: 20, padding: 18, gap: 10},
  heroIcon: {width: 52, height: 52, borderRadius: 16, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center'},
  heroTitle: {fontSize: 22, fontWeight: '900', color: '#020617'},
  heroDescription: {fontSize: 13, color: '#334155', lineHeight: 18},
  heroMeta: {fontSize: 11, color: '#475569', fontWeight: '600'},
  card: {backgroundColor: '#0f172a', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#1e293b'},
  cardTitle: {fontSize: 16, fontWeight: '800', color: '#fff'},
  input: {borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', backgroundColor: '#020617'},
  primaryButton: {backgroundColor: '#0ea5e9', borderRadius: 12, paddingVertical: 12, alignItems: 'center'},
  primaryButtonText: {color: '#fff', fontWeight: '800'},
  secondaryButton: {backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8},
  secondaryButtonText: {color: '#fff', fontWeight: '800'},
  cameraWrapper: {height: 280, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000'},
  camera: {flex: 1},
  cameraUnavailableCard: {backgroundColor: '#0b1120', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 8, alignItems: 'center'},
  cameraUnavailableTitle: {color: '#e2e8f0', fontSize: 14, fontWeight: '800', textAlign: 'center'},
  cameraUnavailableText: {color: '#94a3b8', fontSize: 12, lineHeight: 18, textAlign: 'center'},
  cameraHint: {color: '#94a3b8', fontSize: 11, lineHeight: 16},
  errorCard: {backgroundColor: '#fee2e2', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center'},
  errorText: {flex: 1, color: '#991b1b', fontWeight: '600'},
  resultCard: {backgroundColor: '#111827', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#1f2937'},
  resultRow: {gap: 4},
  resultLabel: {fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700'},
  resultValue: {color: '#fff', fontSize: 13, lineHeight: 18},
});
