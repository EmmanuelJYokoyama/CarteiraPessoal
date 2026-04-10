import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  MapPin,
  MessageSquare,
  Camera,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import {PermissionType} from '@services/permissions';
import {usePermissionsContext} from '@contexts/PermissionsContext';
import {styles} from './styles/PermissionsOnboardingScreen.styles';

interface PermissionItem {
  type: PermissionType;
  name: string;
  icon: React.ReactNode;
  description: string;
  required: boolean;
}

const PERMISSIONS_FLOW: PermissionItem[] = [
  {
    type: PermissionType.LOCATION,
    name: 'Localização',
    icon: <MapPin size={32} color="#3498db" />,
    description:
      'Encontre caixas eletrônicos próximos e ofertas regionalizadas',
    required: false,
  },
  {
    type: PermissionType.SMS,
    name: 'SMS',
    icon: <MessageSquare size={32} color="#2ecc71" />,
    description: 'Receba notificações de segurança e confirmações de transações',
    required: true,
  },
  {
    type: PermissionType.CAMERA,
    name: 'Câmera',
    icon: <Camera size={32} color="#e74c3c" />,
    description: 'Digitalize cartões e verifique sua identidade com segurança',
    required: false,
  },
];

interface PermissionsOnboardingScreenProps {
  onComplete: () => void;
}

export function PermissionsOnboardingScreen({
  onComplete,
}: PermissionsOnboardingScreenProps) {
  const {requestPermission} = usePermissionsContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionStates, setPermissionStates] = useState<
    Record<PermissionType, boolean>
  >({
    [PermissionType.LOCATION]: false,
    [PermissionType.SMS]: false,
    [PermissionType.CAMERA]: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [skippedPermissions, setSkippedPermissions] = useState<PermissionType[]>(
    [],
  );

  const currentPermission = PERMISSIONS_FLOW[currentIndex];
  const isLastPermission = currentIndex === PERMISSIONS_FLOW.length - 1;
  const isGranted = permissionStates[currentPermission.type];

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true);
      const granted = await requestPermission(currentPermission.type);

      setPermissionStates((prev) => ({
        ...prev,
        [currentPermission.type]: granted,
      }));

      if (granted) {
        setTimeout(() => {
          if (isLastPermission) {
            onComplete();
          } else {
            setCurrentIndex(currentIndex + 1);
          }
        }, 800);
      } else {
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (!currentPermission.required) {
      const newSkipped = [...skippedPermissions, currentPermission.type];
      setSkippedPermissions(newSkipped);

      if (isLastPermission) {
        onComplete();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleSkipAll = () => {
    onComplete();
  };

  const progress = ((currentIndex + 1) / PERMISSIONS_FLOW.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Permissões necessárias</Text>
        <Text style={styles.headerSubtitle}>
          Passo {currentIndex + 1} de {PERMISSIONS_FLOW.length}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${progress}%`},
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>{currentPermission.icon}</View>

        <Text style={styles.permissionTitle}>{currentPermission.name}</Text>
        <Text style={styles.permissionDescription}>
          {currentPermission.description}
        </Text>

        {isGranted && (
          <View style={styles.successContainer}>
            <Check size={24} color="#2ecc71" />
            <Text style={styles.successText}>Permissão concedida! ✓</Text>
          </View>
        )}

        {currentIndex > 0 && (
          <View style={styles.completedPermissionsContainer}>
            <Text style={styles.completedTitle}>Progresso:</Text>
            <FlatList
              data={PERMISSIONS_FLOW.slice(0, currentIndex)}
              keyExtractor={(item) => item.type}
              scrollEnabled={false}
              renderItem={({item}) => (
                <View
                  style={[
                    styles.completedItem,
                    permissionStates[item.type] && styles.grantedItem,
                  ]}>
                  <View style={styles.completedItemIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.completedItemContent}>
                    <Text style={styles.completedItemName}>{item.name}</Text>
                    {permissionStates[item.type] && (
                      <Text style={styles.grantedLabel}>Autorizada ✓</Text>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {isGranted ? (
          <Pressable
            style={styles.nextButton}
            onPress={() => {
              if (isLastPermission) {
                onComplete();
              } else {
                setCurrentIndex(currentIndex + 1);
              }
            }}>
            <Text style={styles.nextButtonText}>
              {isLastPermission ? 'Concluir' : 'Próxima'}
            </Text>
            <ChevronRight size={20} color="#fff" />
          </Pressable>
        ) : (
          <>
            <Pressable
              style={styles.allowButton}
              onPress={handleRequestPermission}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.allowButtonText}>Permitir</Text>
                </>
              )}
            </Pressable>

            {!currentPermission.required && (
              <Pressable
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isLoading}>
                <Text style={styles.skipButtonText}>Pular</Text>
              </Pressable>
            )}
          </>
        )}

        <Pressable
          style={styles.skipAllButton}
          onPress={handleSkipAll}>
          <Text style={styles.skipAllButtonText}>Pular tudo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
