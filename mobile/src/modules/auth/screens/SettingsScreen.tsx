import React from 'react';
import {View, Text, Pressable, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Lock, Info, Package, ChevronRight} from 'lucide-react-native';
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
];

export default function SettingsScreen({navigation}: Props) {
  const handleItemPress = (item: SettingsItem) => {
    if (item.screen) {
      navigation.navigate(item.screen);
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
    </View>
  );
}
