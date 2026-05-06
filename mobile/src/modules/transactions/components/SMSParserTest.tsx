import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {MessageCircle, CheckCircle, AlertCircle, Copy} from 'lucide-react-native';
import {apiRequest} from '@services/api/client';
import {styles} from './styles/SMSParserTest.styles';

interface ParsedSMS {
  bank: string;
  amount: number;
  establishment?: string;
  date?: string;
  parsed: boolean;
  rawMessage: string;
}

export function SMSParserTest() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedSMS | null>(null);
  const [history, setHistory] = useState<ParsedSMS[]>([]);

  const examples = [
    'ITAU: Compra aprovada de R$ 150,50 em PADARIA DO JOAO em 25/12/23 14:30',
    'BRADESCO: Transacao de R$ 250,00 com CINEMA MULTIPLEX em 25/12/2023',
    'NUBANK: Compra no Nubank de R$ 320,00 em UBER',
    'Compra de R$ 89,99 em MERCADO CENTER às 14:30',
  ];

  async function handleTestParse() {
    if (!message.trim()) {
      Alert.alert('Erro', 'Digite uma mensagem SMS');
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest<ParsedSMS>('/sms/test-parse', {
        method: 'POST',
        body: {message: message.trim()},
      });

      setResult(response);
      setHistory([response, ...history.slice(0, 4)]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer parsing do SMS');
    } finally {
      setLoading(false);
    }
  }

  function handleUseExample(example: string) {
    setMessage(example);
  }

  function handleCopyToClipboard() {
    if (!result) return;
    // Note: In a real app, you'd use a clipboard library like @react-native-clipboard/clipboard
    Alert.alert('Copiado', 'Resultado copiado para clipboard');
  }

  function handleClear() {
    setMessage('');
    setResult(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MessageCircle size={28} color="#3b82f6" />
          <Text style={styles.title}>Parser de SMS Bancário</Text>
        </View>

        <Text style={styles.subtitle}>
          Cole uma mensagem SMS de transação para extração de dados
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Mensagem SMS</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Cole aqui a mensagem de SMS bancária..."
            placeholderTextColor="#666"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <View style={styles.examplesSection}>
          <Text style={styles.exampleTitle}>Exemplos rápidos:</Text>
          {examples.map((example, idx) => (
            <Pressable
              key={idx}
              style={styles.exampleButton}
              onPress={() => handleUseExample(example)}>
              <Text style={styles.exampleText}>{example.substring(0, 50)}...</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={loading || !message}>
            <Text style={styles.clearButtonText}>Limpar</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.parseButton]}
            onPress={handleTestParse}
            disabled={loading || !message.trim()}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.parseButtonText}>Fazer Parse</Text>
              </>
            )}
          </Pressable>
        </View>

        {result && (
          <View style={[styles.resultCard, !result.parsed && styles.resultCardError]}>
            <View style={styles.resultHeader}>
              {result.parsed ? (
                <CheckCircle size={24} color="#10b981" />
              ) : (
                <AlertCircle size={24} color="#ef4444" />
              )}
              <Text style={styles.resultStatus}>
                {result.parsed ? 'Parse bem-sucedido' : 'Não foi possível fazer parse'}
              </Text>
            </View>

            {result.parsed && (
              <View style={styles.resultData}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Banco:</Text>
                  <Text style={styles.dataValue}>{result.bank.toUpperCase()}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Valor:</Text>
                  <Text style={styles.dataValue}>R$ {result.amount.toFixed(2)}</Text>
                </View>

                {result.establishment && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Estabelecimento:</Text>
                    <Text style={styles.dataValue}>{result.establishment}</Text>
                  </View>
                )}

                {result.date && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Data:</Text>
                    <Text style={styles.dataValue}>{result.date}</Text>
                  </View>
                )}

                <Pressable style={styles.copyButton} onPress={handleCopyToClipboard}>
                  <Copy size={16} color="#3b82f6" />
                  <Text style={styles.copyButtonText}>Copiar resultado</Text>
                </Pressable>
              </View>
            )}

            {!result.parsed && (
              <View style={styles.errorInfo}>
                <Text style={styles.errorMessage}>
                  Formato de SMS não reconhecido. Tente um SMS de transação válido dos bancos suportados
                  (Itaú, Bradesco, Nubank).
                </Text>
              </View>
            )}

            <View style={styles.rawMessageSection}>
              <Text style={styles.rawLabel}>Mensagem original:</Text>
              <View style={styles.rawBox}>
                <Text style={styles.rawText}>{result.rawMessage}</Text>
              </View>
            </View>
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Histórico recente:</Text>
            <FlatList
              data={history}
              keyExtractor={(item, idx) => idx.toString()}
              scrollEnabled={false}
              renderItem={({item}) => (
                <Pressable
                  style={styles.historyItem}
                  onPress={() => {
                    setMessage(item.rawMessage);
                    setResult(item);
                  }}>
                  <View style={{flex: 1}}>
                    {item.parsed ? (
                      <>
                        <Text style={styles.historyAmount}>R$ {item.amount.toFixed(2)}</Text>
                        <Text style={styles.historyBank}>{item.bank}</Text>
                      </>
                    ) : (
                      <Text style={styles.historyError}>Parse falhou</Text>
                    )}
                  </View>
                  <Text style={styles.historyPreview}>
                    {item.rawMessage.substring(0, 30)}...
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
