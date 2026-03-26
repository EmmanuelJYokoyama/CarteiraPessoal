import React from 'react';
import {View, Text, Pressable, StyleSheet, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Settings'>;

const SETTINGS_ITEMS = [
  {id: '1', title: 'Configurar PIN', icon: '🔐', screen: 'SetPin'},
  {id: '2', title: 'Sobre', icon: 'ℹ️', screen: null},
  {id: '3', title: 'Versão', icon: '📦', screen: null},
];

export default function SettingsScreen({navigation}: Props) {
  const handleItemPress = (item: any) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {/* Settings List */}
      <FlatList
        data={SETTINGS_ITEMS}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({item}) => (
          <Pressable
            style={styles.settingItem}
            onPress={() => handleItemPress(item)}>
            <Text style={styles.settingIcon}>{item.icon}</Text>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.screen && <Text style={styles.settingArrow}>›</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1d3a6e',
  },
  backButton: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 50,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  settingArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
});
