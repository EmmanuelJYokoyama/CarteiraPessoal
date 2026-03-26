import {useMemo, useState} from 'react';
import {register} from '@services/api/auth';

export function registerService(onSuccess: (email: string) => void) {
    const [name,         setName]         = useState('');
    const [email,        setEmail]        = useState('');
    const [phoneNumber,  setPhoneNumber]  = useState('');
    const [password,     setPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading,      setLoading]      = useState(false);

    const canSubmit = useMemo(() => 
        name.trim().length > 0 
        && email.trim().length > 0 
        && phoneNumber.trim().length > 0
        && password.trim().length >= 6 
        && password === confirmPassword,
        [name, email, phoneNumber, password, confirmPassword],
    );

    async function handleRegister() {
    if (!canSubmit || loading) return;

    try {
        setLoading(true);
        setErrorMessage('');

        await register({
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        });

        onSuccess(email.trim());
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
        phoneNumber,  setPhoneNumber,
        password,     setPassword,
        confirmPassword, setConfirmPassword,
        errorMessage,
        loading,
        canSubmit,
        handleRegister,
    };
}