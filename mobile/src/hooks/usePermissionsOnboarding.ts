import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSIONS_ONBOARDING_KEY = 'permissions_onboarding_completed';

export function usePermissionsOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(PERMISSIONS_ONBOARDING_KEY);
      setHasCompletedOnboarding(completed === 'true');
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markOnboardingAsCompleted = async () => {
    try {
      await AsyncStorage.setItem(PERMISSIONS_ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Erro ao marcar onboarding como completo:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(PERMISSIONS_ONBOARDING_KEY);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Erro ao resetar onboarding:', error);
    }
  };

  return {
    hasCompletedOnboarding,
    isLoading,
    markOnboardingAsCompleted,
    resetOnboarding,
  };
}
