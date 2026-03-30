import React from 'react';
import {View, Text, Pressable, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Icon, type IconName} from '@components/common/Icon';
import {styles} from './styles/SettingsScreen.styles';

type Props = NativeStackScreenProps<any, 'Settings'>;

interface SettingsItem {
  id: string;
  title: string;
  icon: IconName;
  screen: string | null;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {id: '1', title: 'Configurar PIN', icon: 'lock', screen: 'SetPin'},
  {id: '2', title: 'Sobre', icon: 'info', screen: null},
  {id: '3', title: 'Versão', icon: 'package', screen: null},
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
            <Icon
              name={item.icon}
              size={20}
              color="#fff"
              style={styles.settingIcon}
            />
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.screen && <Icon name="chevron-right" size={20} color="#999" />}
          </Pressable>
        )}
      />
    </View>
  );
}
