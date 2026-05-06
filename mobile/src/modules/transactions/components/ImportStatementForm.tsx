import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {Upload, CheckCircle, AlertCircle, Trash2} from 'lucide-react-native';
import DocumentPicker from 'react-native-document-picker';
import {apiRequest} from '@services/api/client';
import {styles} from './styles/ImportStatementForm.styles';

interface ImportStatementFormProps {
  cardId: string;
  onSuccess?: () => void;
}

interface ImportResult {
  imported: number;
  failed: number;
  duplicates: number;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
  }>;
}

interface ParsedStatement {
  format: 'ofx' | 'csv';
  transactionCount: number;
  errors: string[];
}

export function ImportStatementForm({cardId, onSuccess}: ImportStatementFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'ofx' | 'csv' | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function handlePickFile() {
    try {
      const file = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.plainText,
          DocumentPicker.types.pdf,
          'application/octet-stream',
        ],
      });

      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Erro', 'Arquivo muito grande (máximo 5MB)');
        return;
      }

      const format = file.name.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv';
      setSelectedFormat(format);

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    } catch (error: any) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Erro', 'Falha ao selecionar arquivo');
      }
    }
  }

  async function handleTestParse() {
    if (!fileContent || !selectedFormat) {
      Alert.alert('Erro', 'Selecione um arquivo primeiro');
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      const response = await apiRequest<ParsedStatement>(
        '/statements/test-parse',
        {
          method: 'POST',
          body: {format: selectedFormat, content: fileContent},
        }
      );

      setParsed(response);

      if (response.errors.length > 0) {
        setErrors(response.errors);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer parsing');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!fileContent || !selectedFormat) {
      Alert.alert('Erro', 'Selecione um arquivo primeiro');
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      const response = await apiRequest<{
        success: boolean;
        result: ImportResult;
        warnings: string[];
      }>('/statements/import', {
        method: 'POST',
        body: {format: selectedFormat, cardId, content: fileContent},
      });

      setResult(response.result);

      if (response.warnings.length > 0) {
        setErrors(response.warnings);
      }

      Alert.alert('Sucesso', `${response.result.imported} transações importadas!`);
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao importar extrato');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFileContent('');
    setSelectedFormat(null);
    setParsed(null);
    setResult(null);
    setErrors([]);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Importar Extrato Bancário</Text>
        <Text style={styles.subtitle}>
          Importe transações de arquivos OFX ou CSV
        </Text>

        {!result ? (
          <>
            <View style={styles.formatSection}>
              <Text style={styles.sectionTitle}>Formato do Arquivo</Text>

              <View style={styles.formatButtons}>
                <Pressable
                  style={[
                    styles.formatButton,
                    selectedFormat === 'ofx' && styles.formatButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedFormat('ofx');
                    setParsed(null);
                  }}>
                  <Text
                    style={[
                      styles.formatButtonText,
                      selectedFormat === 'ofx' && styles.formatButtonTextActive,
                    ]}>
                    OFX
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.formatButton,
                    selectedFormat === 'csv' && styles.formatButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedFormat('csv');
                    setParsed(null);
                  }}>
                  <Text
                    style={[
                      styles.formatButtonText,
                      selectedFormat === 'csv' && styles.formatButtonTextActive,
                    ]}>
                    CSV
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.uploadButton}
              onPress={handlePickFile}
              disabled={loading}>
              <Upload size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {fileContent ? 'Arquivo selecionado ✓' : 'Selecionar arquivo'}
              </Text>
            </Pressable>

            {fileContent && !parsed && (
              <Pressable
                style={styles.previewButton}
                onPress={handleTestParse}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.previewButtonText}>Visualizar antes de importar</Text>
                  </>
                )}
              </Pressable>
            )}

            {parsed && (
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <CheckCircle size={20} color="#10b981" />
                  <Text style={styles.previewTitle}>
                    {parsed.transactionCount} transações encontradas
                  </Text>
                </View>

                {errors.length > 0 && (
                  <View style={styles.errorsList}>
                    {errors.map((error, idx) => (
                      <View key={idx} style={styles.errorItem}>
                        <AlertCircle size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <Pressable
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleReset}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.importButton]}
                    onPress={handleImport}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.importButtonText}>Importar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Importação Concluída</Text>

            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Importadas</Text>
                <Text style={[styles.statValue, {color: '#10b981'}]}>
                  {result.imported}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duplicatas</Text>
                <Text style={[styles.statValue, {color: '#f59e0b'}]}>
                  {result.duplicates}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Erros</Text>
                <Text style={[styles.statValue, {color: '#ef4444'}]}>
                  {result.failed}
                </Text>
              </View>
            </View>

            {result.transactions.length > 0 && (
              <View style={styles.transactionsList}>
                <Text style={styles.listTitle}>Transações importadas:</Text>

                <FlatList
                  data={result.transactions}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({item}) => (
                    <View style={styles.transactionItem}>
                      <View style={{flex: 1}}>
                        <Text style={styles.txDescription}>{item.description}</Text>
                        <Text style={styles.txDate}>
                          {new Date(item.transactionDate).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>R$ {item.amount.toFixed(2)}</Text>
                    </View>
                  )}
                />
              </View>
            )}

            <Pressable style={styles.doneButton} onPress={handleReset}>
              <Text style={styles.doneButtonText}>Concluído</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
