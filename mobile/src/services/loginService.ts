import {useState} from 'react';
import {login} from '@services/api/auth';
import {useAuth} from '@contexts/AuthContext';

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

      await signIn(response.accessToken, response.refreshToken, {
        name: response.name,
        email: response.email,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Não foi possível entrar';
      
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