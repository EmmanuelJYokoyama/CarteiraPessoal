import {useState, useMemo} from 'react';
import {createCard} from '@services/api/cards';

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiryDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function cardsService(onSuccess: (cardId: string) => void) {
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit' | 'prepaid'>('credit');
  const [expiryDate, setExpiryDate] = useState('');
  const [limit, setLimit] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const cardNumberDigits = cardNumber.replace(/\D/g, '');
  const lastFourDigits = cardNumberDigits.slice(-4);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      cardNumberDigits.length >= 13 &&
      expiryDate.length === 5 &&
      cardType.length > 0,
    [name, cardNumberDigits, expiryDate, cardType],
  );

  function handleCardNumberChange(value: string) {
    setCardNumber(formatCardNumber(value));
  }

  function handleExpiryDateChange(value: string) {
    setExpiryDate(formatExpiryDate(value));
  }

  async function handleAddCard() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const payload: any = {
        name: name.trim(),
        cardNumber: cardNumberDigits,
        lastFourDigits,
        cardType,
        expiryDate,
      };

      // Only include limit if it's not empty
      if (limit && limit.trim() !== '') {
        payload.limit = limit.trim();
      }

      const response = await createCard(payload);

      setName('');
      setCardNumber('');
      setExpiryDate('');
      setCardType('credit');
      setLimit('');

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
    handleCardNumberChange,
    cardType,
    setCardType,
    expiryDate,
    handleExpiryDateChange,
    limit,
    setLimit,
    errorMessage,
    loading,
    canSubmit,
    handleAddCard,
  };
}
