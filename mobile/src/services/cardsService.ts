import {useState, useMemo} from 'react';
import {createCard} from '@services/api/cards';

export function cardsService(onSuccess: (cardId: string) => void) {
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit' | 'prepaid'>('credit');
  const [expiryDate, setExpiryDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const lastFourDigits = cardNumber.slice(-4);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      cardNumber.length >= 13 &&
      expiryDate.length === 5 &&
      cardType.length > 0,
    [name, cardNumber, expiryDate, cardType],
  );

  async function handleAddCard() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const response = await createCard({
        name: name.trim(),
        cardNumber,
        lastFourDigits,
        cardType,
        expiryDate,
      });

      setName('');
      setCardNumber('');
      setExpiryDate('');
      setCardType('credit');

      onSuccess(response.id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Não foi possível adicionar o cartão';

      if (errorMsg === 'OFFLINE_REQUEST_QUEUED') {
        setErrorMessage('Cartão será adicionado quando conectar.');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    cardNumber,
    setCardNumber,
    cardType,
    setCardType,
    expiryDate,
    setExpiryDate,
    errorMessage,
    loading,
    canSubmit,
    handleAddCard,
  };
}
