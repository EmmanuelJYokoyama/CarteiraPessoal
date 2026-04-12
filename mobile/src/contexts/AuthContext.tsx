import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserData = {
  name: string;
  email: string;
};

type AuthContextType = {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
  user: UserData | null;
  signOut: () => void;
  signIn: (accessToken: string, refreshToken: string, user: UserData) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useState({
    isLoading: true,
    isSignedIn: false,
    userToken: null as string | null,
    user: null as UserData | null,
  });

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        const userData = await AsyncStorage.getItem('@user_data');
        const user = userData ? JSON.parse(userData) : null;
        
        dispatch({
          isLoading: false,
          isSignedIn: !!token,
          userToken: token,
          user,
        });
      } catch (e) {
        console.error('Failed to restore token', e);
        dispatch({
          isLoading: false,
          isSignedIn: false,
          userToken: null,
          user: null,
        });
      }
    };

    bootstrapAsync();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('@access_token');
        const userData = await AsyncStorage.getItem('@user_data');
        const user = userData ? JSON.parse(userData) : null;
        
        dispatch(prev => {
          if (prev.userToken !== token || JSON.stringify(prev.user) !== JSON.stringify(user)) {
            return {
              isLoading: false,
              isSignedIn: !!token,
              userToken: token,
              user,
            };
          }
          return prev;
        });
      } catch (e) {
        console.error('Failed to check token', e);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const value: AuthContextType = {
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    userToken: state.userToken,
    user: state.user,
    signIn: async (accessToken: string, refreshToken: string, user: UserData) => {
      try {
        await AsyncStorage.setItem('@access_token', accessToken);
        await AsyncStorage.setItem('@refresh_token', refreshToken);
        await AsyncStorage.setItem('@user_data', JSON.stringify(user));
        dispatch({
          isLoading: false,
          isSignedIn: true,
          userToken: accessToken,
          user,
        });
      } catch (e) {
        console.error('Failed to sign in', e);
        throw e;
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('@access_token');
        await AsyncStorage.removeItem('@refresh_token');
        await AsyncStorage.removeItem('@user_data');
        dispatch({
          isLoading: false,
          isSignedIn: false,
          userToken: null,
          user: null,
        });
      } catch (e) {
        console.error('Failed to sign out', e);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
