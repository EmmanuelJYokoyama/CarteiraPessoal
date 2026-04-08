import {Platform, PermissionsAndroid, Alert} from 'react-native';

export enum PermissionType {
  LOCATION = 'location',
  SMS = 'sms',
  CAMERA = 'camera',
}

export interface PermissionConfig {
  type: PermissionType;
  title: string;
  message: string;
  permissions: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS][];
}

const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  [PermissionType.LOCATION]: {
    type: PermissionType.LOCATION,
    title: 'Permissão de Localização',
    message:
      'Precisamos acessar sua localização para fornecer serviços baseados em localização, como encontrar caixas eletrônicos próximos e personalizar ofertas regionais.',
    permissions: [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ],
  },
  [PermissionType.SMS]: {
    type: PermissionType.SMS,
    title: 'Permissão de SMS',
    message:
      'Precisamos de acesso SMS para enviar notificações de segurança, confirmação de transações e alertas de alertas de gastos para sua segurança.',
    permissions: [
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    ],
  },
  [PermissionType.CAMERA]: {
    type: PermissionType.CAMERA,
    title: 'Permissão de Câmera',
    message:
      'Precisamos acessar sua câmera para permitir que você tire fotos de recibos, digitalize cartões de crédito e verifique sua identidade de forma segura.',
    permissions: [PermissionsAndroid.PERMISSIONS.CAMERA],
  },
};

export interface PermissionResult {
  granted: boolean;
  deniedCount: number;
  details: Record<string, boolean>;
}

/**
 * Solicita permissões específicas ao usuário
 * @param permissionType - Tipo de permissão a solicitar
 * @returns Promise com resultado da solicitação
 */
export async function requestPermission(
  permissionType: PermissionType,
): Promise<PermissionResult> {
  // iOS não usa PermissionsAndroid em tempo de execução igual Android
  if (Platform.OS === 'ios') {
    console.warn('Permissões no iOS são gerenciadas via Info.plist');
    return {
      granted: true,
      deniedCount: 0,
      details: {},
    };
  }

  const config = PERMISSION_CONFIGS[permissionType];

  try {
    const results = await PermissionsAndroid.requestMultiple(
      config.permissions,
    );

    let allGranted = true;
    let deniedCount = 0;
    const details: Record<string, boolean> = {};

    for (const [permission, result] of Object.entries(results)) {
      const isGranted =
        result === PermissionsAndroid.RESULTS.GRANTED;
      details[permission] = isGranted;

      if (!isGranted) {
        allGranted = false;
        deniedCount++;
      }
    }

    return {
      granted: allGranted,
      deniedCount,
      details,
    };
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return {
      granted: false,
      deniedCount: config.permissions.length,
      details: {},
    };
  }
}

/**
 * Verifica se uma permissão foi concedida
 * @param permissionType - Tipo de permissão a verificar
 * @returns Promise com status da permissão
 */
export async function checkPermission(
  permissionType: PermissionType,
): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  const config = PERMISSION_CONFIGS[permissionType];

  try {
    const results = await Promise.all(
      config.permissions.map((permission) =>
        PermissionsAndroid.check(permission),
      ),
    );

    return results.every((result) => result === true);
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Obtém a configuração de uma permissão para exibir no dialogo
 */
export function getPermissionConfig(
  permissionType: PermissionType,
): PermissionConfig {
  return PERMISSION_CONFIGS[permissionType];
}

/**
 * Solicita permissão com diálogo explicativo personalizado
 */
export async function requestPermissionWithDialog(
  permissionType: PermissionType,
  onGranted?: () => void,
  onDenied?: () => void,
): Promise<boolean> {
  const config = getPermissionConfig(permissionType);

  return new Promise((resolve) => {
    Alert.alert(config.title, config.message, [
      {
        text: 'Agora não',
        onPress: () => {
          onDenied?.();
          resolve(false);
        },
        style: 'cancel',
      },
      {
        text: 'Permitir',
        onPress: async () => {
          const result = await requestPermission(permissionType);
          if (result.granted) {
            onGranted?.();
            resolve(true);
          } else {
            Alert.alert(
              'Permissão Necessária',
              `A permissão de ${config.title.toLowerCase()} é necessária para usar este recurso. Você pode ativar nas configurações do aplicativo.`,
              [
                {text: 'Fechar', style: 'cancel'},
              ],
            );
            onDenied?.();
            resolve(false);
          }
        },
      },
    ]);
  });
}

/**
 * Solicita múltiplas permissões
 */
export async function requestMultiplePermissions(
  permissionTypes: PermissionType[],
): Promise<Partial<Record<PermissionType, PermissionResult>>> {
  const results: Partial<Record<PermissionType, PermissionResult>> = {};

  for (const type of permissionTypes) {
    results[type] = await requestPermission(type);
  }

  return results;
}

/**
 * Verifica se todas as permissões foram concedidas
 */
export async function checkAllPermissions(
  permissionTypes: PermissionType[],
): Promise<boolean> {
  const results = await Promise.all(
    permissionTypes.map((type) => checkPermission(type)),
  );

  return results.every((result) => result === true);
}

/**
 * Obtém as permissões que ainda não foram concedidas
 */
export async function getUngrantedPermissions(
  permissionTypes: PermissionType[],
): Promise<PermissionType[]> {
  const results = await Promise.all(
    permissionTypes.map(async (type) => ({
      type,
      granted: await checkPermission(type),
    })),
  );

  return results
    .filter((result) => !result.granted)
    .map((result) => result.type);
}
