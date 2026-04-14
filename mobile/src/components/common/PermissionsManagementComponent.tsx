import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  MapPin,
  MessageSquare,
  Camera,
  ChevronRight,
} from 'lucide-react-native';
import {PermissionType} from '@services/permissions';
import {usePermissionsContext} from '@contexts/PermissionsContext';
import {styles} from './styles/PermissionsManagementComponent.styles';

interface PermissionItemData {
  type: PermissionType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const PERMISSIONS: PermissionItemData[] = [
  {
    type: PermissionType.LOCATION,
    name: 'Localização',
    icon: <MapPin size={20} color="#3498db" />,
    description: 'Encontre serviços próximos',
  },
  {
    type: PermissionType.SMS,
    name: 'SMS',
    icon: <MessageSquare size={20} color="#2ecc71" />,
    description: 'Notificações de segurança e transações',
  },
  {
    type: PermissionType.CAMERA,
    name: 'Câmera',
    icon: <Camera size={20} color="#e74c3c" />,
    description: 'Digitalizar cartões e documentos',
  },
];

export function PermissionsManagementComponent() {
  const {requestPermission, checkPermission: checkPerm} = usePermissionsContext();
  const [permissionStates, setPermissionStates] = useState<
    Record<PermissionType, boolean>
  >({
    [PermissionType.LOCATION]: false,
    [PermissionType.SMS]: false,
    [PermissionType.CAMERA]: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState<
    PermissionType | null
  >(null);

  // Carrega status das permissões ao inicializar
  useEffect(() => {
    loadPermissionStatuses();
  }, []);

  const loadPermissionStatuses = async () => {
    try {
      setIsLoading(true);
      const statuses: Record<PermissionType, boolean> = {
        [PermissionType.LOCATION]: false,
        [PermissionType.SMS]: false,
        [PermissionType.CAMERA]: false,
      };

      for (const perm of PERMISSIONS) {
        const status = await checkPerm(perm.type);
        statuses[perm.type] = status;
      }

      setPermissionStates(statuses);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async (permissionType: PermissionType) => {
    try {
      setRequestingPermission(permissionType);
      const granted = await requestPermission(permissionType);

      setPermissionStates((prev) => ({
        ...prev,
        [permissionType]: granted,
      }));
    } finally {
      setRequestingPermission(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permissões</Text>
      <Text style={styles.subtitle}>
        Gerencie o acesso do app aos recursos do seu dispositivo
      </Text>

      {PERMISSIONS.map((permission) => {
        const isGranted = permissionStates[permission.type];
        const isRequesting = requestingPermission === permission.type;

        return (
          <Pressable
            key={permission.type}
            style={[
              styles.permissionItem,
              isGranted && styles.grantedPermissionItem,
            ]}
            onPress={() => {
              if (!isGranted) {
                handleRequestPermission(permission.type);
              }
            }}
            disabled={isGranted || isRequesting}>
            <View style={styles.permissionIcon}>{permission.icon}</View>

            <View style={styles.permissionContent}>
              <Text style={styles.permissionName}>{permission.name}</Text>
              <Text style={styles.permissionDescription}>
                {permission.description}
              </Text>
            </View>

            <View style={styles.permissionRight}>
              {isGranted ? (
                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedText}>Autorizada</Text>
                </View>
              ) : isRequesting ? (
                <ActivityIndicator size="small" color="#0f766e" />
              ) : (
                <ChevronRight size={20} color="#666" />
              )}
            </View>
          </Pressable>
        );
      })}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Você pode alterar estas permissões nas configurações do seu
          dispositivo a qualquer momento, ou aqui neste aplicativo.
        </Text>
      </View>

      <Pressable
        style={styles.reloadButton}
        onPress={loadPermissionStatuses}>
        <Text style={styles.reloadButtonText}>Verificar novamente</Text>
      </Pressable>
    </View>
  );
}
