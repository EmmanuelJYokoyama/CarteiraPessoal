import {useMemo, useState} from 'react';
import {register} from '@services/api/auth';

export function registerService(onSuccess: () => void) {
    const [name,         setName]         = useState('');
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading,      setLoading]      = useState(false);

    const canSubmit = useMemo(() => 
        name.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6 && password === confirmPassword,
        [name, email, password, confirmPassword],
    );

    async function handleRegister() {
    if (!canSubmit || loading) return;

    try {
        setLoading(true);
        setErrorMessage('');

        await register({
        name: name.trim(),
        email: email.trim(),
        password,
        });

        onSuccess();
    } catch (error) {
        setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível se cadastrar',
        );
    } finally {
        setLoading(false);
    }
    }

    return {
        name,         setName,
        email,        setEmail,
        password,     setPassword,
        confirmPassword, setConfirmPassword,
        errorMessage,
        loading,
        canSubmit,
        handleRegister,
    };
}