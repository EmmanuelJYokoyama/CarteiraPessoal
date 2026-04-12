import React, {useState} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import {PermissionType} from '@services/permissions';
import {usePermissionsContext} from '@contexts/PermissionsContext';
import {PermissionRequestModal} from '@components/common/PermissionRequestModal';

export function PermissionsExampleScreen() {
  const {requestPermission, checkPermission} = usePermissionsContext();
  const [showPermissionModal, setShowPermissionModal] =
    useState<PermissionType | null>(null);
  const [permissionStatuses, setPermissionStatuses] = useState({
    [PermissionType.LOCATION]: false,
    [PermissionType.SMS]: false,
    [PermissionType.CAMERA]: false,
  });

  const handleRequestPermission = async (
    permissionType: PermissionType,
  ) => {
    setShowPermissionModal(permissionType);
  };

  const handlePermissionGranted = async (
    permissionType: PermissionType,
  ) => {
    setPermissionStatuses((prev) => ({
      ...prev,
      [permissionType]: true,
    }));
  };

  const handleCheckPermission = async (
    permissionType: PermissionType,
  ) => {
    const granted = await checkPermission(permissionType);
    setPermissionStatuses((prev) => ({
      ...prev,
      [permissionType]: granted,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gerenciar Permissões</Text>

      <PermissionCard
        title="Localização (GPS)"
        description="Para encontrar serviços próximos e personalizar ofertas"
        isGranted={permissionStatuses[PermissionType.LOCATION]}
        onRequest={() => handleRequestPermission(PermissionType.LOCATION)}
        onCheck={() => handleCheckPermission(PermissionType.LOCATION)}
      />

      <PermissionCard
        title="SMS"
        description="Para notificações de segurança e confirmações"
        isGranted={permissionStatuses[PermissionType.SMS]}
        onRequest={() => handleRequestPermission(PermissionType.SMS)}
        onCheck={() => handleCheckPermission(PermissionType.SMS)}
      />

      <PermissionCard
        title="Câmera"
        description="Para capturar fotos e digitalizar documentos"
        isGranted={permissionStatuses[PermissionType.CAMERA]}
        onRequest={() => handleRequestPermission(PermissionType.CAMERA)}
        onCheck={() => handleCheckPermission(PermissionType.CAMERA)}
      />

      <PermissionRequestModal
        visible={showPermissionModal !== null}
        permissionType={showPermissionModal || PermissionType.LOCATION}
        onClose={() => setShowPermissionModal(null)}
        onGranted={() => {
          if (showPermissionModal) {
            handlePermissionGranted(showPermissionModal);
          }
        }}
      />
    </ScrollView>
  );
}

interface PermissionCardProps {
  title: string;
  description: string;
  isGranted: boolean;
  onRequest: () => void;
  onCheck: () => void;
}

function PermissionCard({
  title,
  description,
  isGranted,
  onRequest,
  onCheck,
}: PermissionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isGranted ? styles.grantedBadge : styles.deniedBadge,
          ]}>
          <Text
            style={[
              styles.statusText,
              isGranted ? styles.grantedText : styles.deniedText,
            ]}>
            {isGranted ? 'Autorizada' : 'Não autorizada'}
          </Text>
        </View>
      </View>

      <View style={styles.cardButtons}>
        <Pressable style={[styles.button, styles.checkButton]} onPress={onCheck}>
          <Text style={styles.checkButtonText}>Verificar</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            isGranted ? styles.disabledButton : styles.requestButton,
          ]}
          onPress={onRequest}
          disabled={isGranted}>
          <Text
            style={
              isGranted ? styles.disabledButtonText : styles.requestButtonText
            }>
            {isGranted ? 'Autorizada' : 'Solicitar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  grantedBadge: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  deniedBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grantedText: {
    color: '#2ecc71',
  },
  deniedText: {
    color: '#e74c3c',
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  checkButtonText: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: 13,
  },
  requestButton: {
    backgroundColor: '#2ecc71',
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  disabledButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
});
