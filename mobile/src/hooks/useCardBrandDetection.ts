import {useMemo} from 'react';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'diners' | 'discover' | 'unknown';

function detectBrandByBin(bin: string): CardBrand {
  const firstDigit = bin[0];
  const firstTwoDigits = bin.substring(0, 2);
  const firstFourDigits = bin.substring(0, 4);

  if (firstDigit === '4') return 'visa';
  if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) return 'mastercard';
  if (['34', '37'].includes(firstTwoDigits)) return 'amex';
  if (['36', '38'].includes(firstTwoDigits)) return 'diners';
  if (
    ['6011', '6363', '6362', '5090'].includes(firstFourDigits) ||
    firstTwoDigits === '65'
  ) {
    return firstFourDigits === '6363' || firstFourDigits === '6362' || firstFourDigits === '5090'
      ? 'elo'
      : 'discover';
  }

  return 'unknown';
}

export function useCardBrandDetection(cardNumber: string) {
  return useMemo(() => {
    const numbers = cardNumber.replace(/\D/g, '');
    if (numbers.length < 4) return 'unknown';
    return detectBrandByBin(numbers);
  }, [cardNumber]);
}

export function getCardBrandColor(brand: CardBrand): string {
  const brandColors: Record<CardBrand, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    elo: '#F79E1B',
    diners: '#0079BE',
    discover: '#FF6000',
    unknown: '#666666',
  };

  return brandColors[brand];
}

export function getCardBrandLabel(brand: CardBrand): string {
  const labels: Record<CardBrand, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    elo: 'Elo',
    diners: 'Diners Club',
    discover: 'Discover',
    unknown: 'Desconhecido',
  };

  return labels[brand];
}
