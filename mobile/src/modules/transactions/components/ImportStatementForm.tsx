import React, {useState} from 'react';
import {View, Text, Pressable, ScrollView, ActivityIndicator, Alert, TextInput} from 'react-native';
import {CheckCircle} from 'lucide-react-native';
import {apiRequest} from '@services/api/client';
import * as Clipboard from 'expo-clipboard';

interface Props {
  cardId: string;
  onSuccess?: () => void;
}

export function ImportStatementForm({cardId, onSuccess}: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<{count: number; errors: string[]} | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePaste() {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setContent(text);
    } catch {
      Alert.alert('Erro', 'Falha ao ler clipboard');
    }
  }

  async function handlePreview() {
    if (!content.trim()) {
      Alert.alert('Erro', 'Cole o arquivo OFX ou CSV');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest.post('/statements/test-parse', {
        content,
        format: content.includes('<OFX>') ? 'ofx' : 'csv',
      });

      setPreview({
        count: res.data.transactionCount,
        errors: res.data.errors || [],
      });
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao analisar');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!content.trim()) {
      Alert.alert('Erro', 'Cole o arquivo');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest.post('/statements/import', {
        cardId,
        content,
        format: content.includes('<OFX>') ? 'ofx' : 'csv',
      });

      setSuccess(true);
      Alert.alert('Sucesso!', `${res.data.imported} transações importadas`);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Falha na importação');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ScrollView style={{padding: 16}}>
        <View style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, padding: 16}}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={{color: '#10b981', fontSize: 16, fontWeight: '600', marginTop: 8}}>
            Importação Concluída!
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{flex: 1, padding: 16}}>
      <Text style={{color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8}}>
        Cole o arquivo OFX ou CSV
      </Text>

      <TextInput
        multiline
        editable={!loading}
        value={content}
        onChangeText={setContent}
        placeholder="Cole aqui..."
        placeholderTextColor="#666"
        style={{
          backgroundColor: '#1a1a1a',
          borderWidth: 1,
          borderColor: '#333',
          color: '#fff',
          borderRadius: 8,
          padding: 12,
          height: 150,
          marginBottom: 12,
        }}
      />

      <Pressable
        onPress={handlePaste}
        disabled={loading}
        style={{
          backgroundColor: '#3498db',
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          opacity: loading ? 0.5 : 1,
        }}>
        <Text style={{color: '#fff', textAlign: 'center', fontWeight: '600'}}>
          {loading ? 'Processando...' : 'Colar do Clipboard'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handlePreview}
        disabled={loading || !content.trim()}
        style={{
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderWidth: 1,
          borderColor: '#3498db',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          opacity: loading || !content.trim() ? 0.5 : 1,
        }}>
        {loading ? (
          <ActivityIndicator color="#3498db" />
        ) : (
          <Text style={{color: '#3498db', textAlign: 'center', fontWeight: '600'}}>
            Visualizar
          </Text>
        )}
      </Pressable>

      {preview && (
        <View style={{backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: 8, padding: 12, marginBottom: 12}}>
          <Text style={{color: '#3498db', fontWeight: '600'}}>
            ✓ {preview.count} transações encontradas
          </Text>
          {preview.errors.length > 0 && (
            <Text style={{color: '#f59e0b', marginTop: 8}}>
              ⚠ {preview.errors[0]}
            </Text>
          )}
        </View>
      )}

      {preview && preview.count > 0 && (
        <Pressable
          onPress={handleImport}
          disabled={loading}
          style={{
            backgroundColor: '#10b981',
            borderRadius: 8,
            padding: 12,
            opacity: loading ? 0.5 : 1,
          }}>
          <Text style={{color: '#fff', textAlign: 'center', fontWeight: '600'}}>
            Importar Agora
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
