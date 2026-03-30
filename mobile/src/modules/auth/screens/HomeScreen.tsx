import React, {useState} from 'react';
import {View, Text, Pressable, Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '@contexts/AuthContext';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {styles} from './styles/HomeScreen.styles';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const {signOut, user} = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const initials = user?.name?.charAt(0)?.toUpperCase() || '👤';

  const handleLogout = async () => {
    setMenuVisible(false);
    await signOut();
  };

  return ( 
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.appTitle}>CARTEIRA PESSOAL</Text>
        
        <Pressable
          onPress={() => setMenuVisible(true)}
          style={styles.avatarButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </Pressable>
      </SafeAreaView>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bem-vindo à Carteira Pessoal</Text>
        <Text style={styles.subtitleText}>
          Suas finanças organizadas no seu celular
        </Text>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{initials}</Text>
              </View>
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName}>{user?.name || 'Seu Nome'}</Text>
                <Text style={styles.menuUserEmail}>{user?.email || 'seu@email.com'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Settings');
              }}>
              <Text style={styles.menuItemText}>Configurações</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleLogout}>
              <Text style={styles.menuItemTextDanger}>Sair</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
