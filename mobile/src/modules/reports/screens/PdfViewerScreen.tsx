import React from 'react';
import {SafeAreaView, View, ActivityIndicator, StyleSheet, Text, Alert} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import {useEffect, useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'PdfViewer'>;

export default function PdfViewerScreen({route}: Props) {
  const {path} = route.params as {path: string};
  const [opening, setOpening] = useState(true);

  useEffect(() => {
    let mounted = true;

    const open = async () => {
      try {
        if (!path) {
          throw new Error('Caminho do PDF ausente');
        }

        const normalizedPath = path.startsWith('file://') ? path.replace('file://', '') : path;
        const exists = await RNFS.exists(normalizedPath);
        if (!exists) {
          throw new Error('Arquivo PDF não encontrado');
        }

        await FileViewer.open(normalizedPath, {showOpenWithDialog: true});
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível abrir o PDF';
        Alert.alert('PDF', message);
      } finally {
        if (mounted) {
          setOpening(false);
        }
      }
    };

    void open();

    return () => {
      mounted = false;
    };
  }, [path]);

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {opening ? <ActivityIndicator size="large" color="#fff" /> : <Text style={styles.text}>PDF aberto no visualizador do aparelho.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
});
