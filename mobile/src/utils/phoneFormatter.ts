export function formatPhoneNumber(input: string): string {
  let cleaned = input.replace(/[^\d+]/g, '');

  if (cleaned.includes('+')) {
    const plusIndex = cleaned.indexOf('+');
    cleaned = '+' + cleaned.substring(plusIndex + 1).replace(/\+/g, '');
  }

  if (cleaned.startsWith('+55')) {
    const withoutCode = cleaned.substring(3);
    const limited = withoutCode.substring(0, 11);

    if (limited.length === 0) {
      return '+55';
    }

    if (limited.length <= 2) {
      return `+55(${limited}`;
    } else if (limited.length <= 7) {
      return `+55(${limited.substring(0, 2)})${limited.substring(2)}`;
    } else {
      return `+55(${limited.substring(0, 2)})${limited.substring(2, 7)}-${limited.substring(7)}`;
    }
  }

  if (cleaned.startsWith('+')) {
    const withoutPlus = cleaned.substring(1);
    const limited = withoutPlus.substring(0, 15);

    if (limited.length === 0) {
      return '+';
    }

    if (limited.length <= 2) {
      return `+${limited}`;
    } else if (limited.length <= 5) {
      return `+${limited.substring(0, 2)} ${limited.substring(2)}`;
    } else if (limited.length <= 10) {
      return `+${limited.substring(0, 2)} ${limited.substring(2, 5)} ${limited.substring(5)}`;
    } else {
      return `+${limited.substring(0, 2)} ${limited.substring(2, 5)} ${limited.substring(5, 10)}-${limited.substring(10)}`;
    }
  }

  const limited = cleaned.substring(0, 11);

  if (limited.length === 0) {
    return '';
  }

  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 7) {
    return `(${limited.substring(0, 2)})${limited.substring(2)}`;
  } else {
    return `(${limited.substring(0, 2)})${limited.substring(2, 7)}-${limited.substring(7)}`;
  }
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+55')) {
    const digitsOnly = cleaned.substring(3);
    return digitsOnly.length === 11;
  }

  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.substring(1);
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }

  return cleaned.length === 11;
}
