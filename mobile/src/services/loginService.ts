import {useState} from 'react';
import {login} from '@services/api/auth';
import {useAuth} from '@contexts/AuthContext';
import {logAuthEvent} from '@services/telemetry/firebaseTelemetry';

export function useLoginService() {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.trim().length >= 6;

  async function handleLogin() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await login({
        email: email.trim(),
        password,
      });

      void logAuthEvent('password_login', 'success', {
        email_domain: email.includes('@') ? email.trim().split('@')[1] : 'unknown',
      });

      await signIn(response.accessToken, response.refreshToken, {
        name: response.name,
        email: response.email,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Não foi possível entrar';

      void logAuthEvent('password_login', 'failure', {
        error_message: errorMsg.slice(0, 80),
      });
      
      if (errorMsg === 'OFFLINE_REQUEST_QUEUED') {
        setErrorMessage('Solicitação enfileirada. Sincronizará quando conectar.');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    errorMessage,
    loading,
    canSubmit,
    handleLogin,
  };
}