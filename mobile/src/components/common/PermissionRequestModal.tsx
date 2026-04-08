import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {MapPin, MessageSquare, Camera, Check} from 'lucide-react-native';
import {PermissionType, getPermissionConfig} from '@services/permissions';
import {usePermissionsContext} from '@contexts/PermissionsContext';

interface PermissionRequestModalProps {
  visible: boolean;
  permissionType: PermissionType;
  onClose: () => void;
  onGranted?: () => void;
}

const PERMISSION_ICONS: Record<PermissionType, React.ReactNode> = {
  [PermissionType.LOCATION]: (
    <MapPin size={32} color="#3498db" />
  ),
  [PermissionType.SMS]: (
    <MessageSquare size={32} color="#2ecc71" />
  ),
  [PermissionType.CAMERA]: (
    <Camera size={32} color="#e74c3c" />
  ),
};

export function PermissionRequestModal({
  visible,
  permissionType,
  onClose,
  onGranted,
}: PermissionRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {requestPermission} = usePermissionsContext();
  const config = getPermissionConfig(permissionType);

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true);
      const granted = await requestPermission(permissionType);

      if (granted) {
        onGranted?.();
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {PERMISSION_ICONS[permissionType]}
          </View>

          <Text style={styles.title}>{config.title}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.messageContainer}>
            <Text style={styles.message}>{config.message}</Text>
          </ScrollView>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Por que precisamos:</Text>
            {getPermissionBenefits(permissionType).map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Check size={16} color="#2ecc71" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.denyButton]}
              onPress={handleDeny}
              disabled={isLoading}>
              <Text style={styles.denyButtonText}>Não agora</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.allowButton]}
              onPress={handleRequestPermission}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.allowButtonText}>Permitir</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.infoText}>
            Você pode alterar esta permissão nas configurações do seu dispositivo
            a qualquer momento.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function getPermissionBenefits(
  permissionType: PermissionType,
): string[] {
  switch (permissionType) {
    case PermissionType.LOCATION:
      return [
        'Encontrar serviços próximos',
        'Personalizar ofertas e promoções',
        'Melhorar sua experiência',
      ];
    case PermissionType.SMS:
      return [
        'Notificações de segurança',
        'Confirmação de transações',
        'Alertas de gastos',
      ];
    case PermissionType.CAMERA:
      return [
        'Capturar fotos de recibos',
        'Digitalizar cartões',
        'Verificação de identidade segura',
      ];
    default:
      return [];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: '85%',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 20,
    maxHeight: 100,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    textAlign: 'justify',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#aaa',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  denyButtonText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  allowButton: {
    backgroundColor: '#2ecc71',
  },
  allowButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoText: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
  },
});
