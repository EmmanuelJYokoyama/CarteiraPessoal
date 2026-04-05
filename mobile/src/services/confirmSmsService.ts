import {useState} from 'react';
import {confirmSms, resendSms} from '@services/api/auth';
import {useAuth} from '@contexts/AuthContext';

export function useConfirmSmsService(email: string) {
  const {signIn} = useAuth();
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const canSubmit = code.trim().length === 6;

  async function handleConfirmSms() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await confirmSms({
        email,
        code: code.trim(),
      });

      await signIn(response.accessToken, response.refreshToken, {
        name: response.name,
        email: response.email,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Código inválido ou expirado',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resending) return;

    try {
      setResending(true);
      setErrorMessage('');

      await resendSms({email});

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao reenviar código',
      );
    } finally {
      setResending(false);
    }
  }

  return {
    code,
    setCode,
    errorMessage,
    loading,
    resending,
    canSubmit,
    handleConfirmSms,
    handleResendCode,
  };
}
