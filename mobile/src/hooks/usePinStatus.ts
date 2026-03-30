import {useEffect, useState} from 'react';
import {validatePin} from '@services/api/pin';

export function usePinStatus() {
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPin = async () => {
      try {
        // Try to validate a dummy PIN just to check if PIN exists
        // This will fail, but we can determine if it's because PIN_NOT_SET or invalid PIN
        await validatePin({pin: '0000'});
        setHasPinConfigured(true);
      } catch (error: any) {
        // If error message contains PIN_NOT_SET or similar, PIN is not configured
        // Otherwise (invalid PIN), it means PIN is configured
        const errorMsg = error?.message?.toLowerCase() || '';
        const statusCode = error?.status || 0;

        // If we get 400 with "PIN não configurado", PIN is not set
        // If we get 401 with "PIN incorreto", PIN is configured but wrong
        setHasPinConfigured(statusCode === 401 || errorMsg.includes('incorreto'));
      } finally {
        setIsChecking(false);
      }
    };

    checkPin();
  }, []);

  return {hasPinConfigured, isChecking};
}
