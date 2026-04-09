import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import {
  PermissionType,
  requestPermissionWithDialog,
  checkPermission,
} from '@services/permissions';

interface PermissionsContextType {
  requestPermission: (permissionType: PermissionType) => Promise<boolean>;
  checkPermission: (permissionType: PermissionType) => Promise<boolean>;
  requestMultiple: (
    permissionTypes: PermissionType[],
  ) => Promise<Partial<Record<PermissionType, boolean>>>;
}

const PermissionsContext = createContext<
  PermissionsContextType | undefined
>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
}

export function PermissionsProvider({
  children,
}: PermissionsProviderProps) {
  const requestPermission = useCallback(
    async (permissionType: PermissionType): Promise<boolean> => {
      return await requestPermissionWithDialog(permissionType);
    },
    [],
  );

  const checkPermissionFn = useCallback(
    async (permissionType: PermissionType): Promise<boolean> => {
      return await checkPermission(permissionType);
    },
    [],
  );

  const requestMultiple = useCallback(
    async (
      permissionTypes: PermissionType[],
    ): Promise<Partial<Record<PermissionType, boolean>>> => {
      const results: Partial<Record<PermissionType, boolean>> = {};

      for (const type of permissionTypes) {
        results[type] = await requestPermission(type);
      }

      return results;
    },
    [requestPermission],
  );

  const value: PermissionsContextType = {
    requestPermission,
    checkPermission: checkPermissionFn,
    requestMultiple,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextType {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error(
      'usePermissionsContext deve ser usado dentro de PermissionsProvider',
    );
  }

  return context;
}
