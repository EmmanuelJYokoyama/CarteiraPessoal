import {useEffect, useState} from 'react';
import {validatePin} from '@services/api/pin';

export function usePinStatus() {
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPin = async () => {
      try {
        await validatePin({pin: '0000'});
        setHasPinConfigured(true);
      } catch (error: any) {
        const errorMsg = error?.message?.toLowerCase() || '';
        const statusCode = error?.status || 0;
        setHasPinConfigured(statusCode === 401 || errorMsg.includes('incorreto'));
      } finally {
        setIsChecking(false);
      }
    };

    checkPin();
  }, []);

  return {hasPinConfigured, isChecking};
}
