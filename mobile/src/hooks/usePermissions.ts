import {useCallback, useEffect, useState} from 'react';
import {
  PermissionType,
  requestPermission,
  requestPermissionWithDialog,
  checkPermission,
  checkAllPermissions,
  getUngrantedPermissions,
  PermissionResult,
} from '@services/permissions';

export interface PermissionState {
  [key: string]: boolean;
}

export interface UsePermissionsReturn {
  // Estados
  permissions: PermissionState;
  isLoading: boolean;
  
  // Métodos
  request: (permissionType: PermissionType) => Promise<PermissionResult>;
  requestWithDialog: (permissionType: PermissionType) => Promise<boolean>;
  check: (permissionType: PermissionType) => Promise<boolean>;
  checkAll: (types: PermissionType[]) => Promise<boolean>;
  getUngranted: (types: PermissionType[]) => Promise<PermissionType[]>;
  hasPermission: (permissionType: PermissionType) => boolean;
  
  // Callbacks
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar permissões do aplicativo
 * @param initialPermissions - Permissões para verificar ao inicializar
 */
export function usePermissions(
  initialPermissions: PermissionType[] = [],
): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [isLoading, setIsLoading] = useState(false);

  // Verifica permissões iniciais
  useEffect(() => {
    if (initialPermissions.length > 0) {
      refetch();
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const newPermissions: PermissionState = {};

      for (const permissionType of initialPermissions) {
        const isGranted = await checkPermission(permissionType);
        newPermissions[permissionType] = isGranted;
      }

      setPermissions(newPermissions);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initialPermissions]);

  const request = useCallback(
    async (permissionType: PermissionType): Promise<PermissionResult> => {
      try {
        setIsLoading(true);
        const result = await requestPermission(permissionType);

        setPermissions((prev) => ({
          ...prev,
          [permissionType]: result.granted,
        }));

        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestWithDialog = useCallback(
    async (permissionType: PermissionType): Promise<boolean> => {
      try {
        setIsLoading(true);
        const granted = await requestPermissionWithDialog(permissionType);

        setPermissions((prev) => ({
          ...prev,
          [permissionType]: granted,
        }));

        return granted;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const check = useCallback(async (permissionType: PermissionType) => {
    return await checkPermission(permissionType);
  }, []);

  const checkAll = useCallback(
    async (types: PermissionType[]) => {
      return await checkAllPermissions(types);
    },
    [],
  );

  const getUngranted = useCallback(
    async (types: PermissionType[]) => {
      return await getUngrantedPermissions(types);
    },
    [],
  );

  const hasPermission = useCallback(
    (permissionType: PermissionType) => {
      return permissions[permissionType] === true;
    },
    [permissions],
  );

  return {
    permissions,
    isLoading,
    request,
    requestWithDialog,
    check,
    checkAll,
    getUngranted,
    hasPermission,
    refetch,
  };
}
