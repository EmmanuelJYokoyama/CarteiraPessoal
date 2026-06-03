/**
 * Centraliza a formatação de valores para garantir consistência em todo o app.
 */

/**
 * Formata valores numéricos para Moeda Brasileira (R$)
 */
export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(isNaN(num) ? 0 : num);
};

/**
 * Formata uma data para o padrão brasileiro DD/MM/AAAA.
 * @param date - Pode ser uma string ISO, um objeto Date ou null
 * @param placeholder - Texto exibido caso a data seja inválida ou vazia
 */
export const formatDate = (date: string | Date | null | undefined, placeholder: string = 'DD/MM/AAAA'): string => {
  if (!date) return placeholder;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return placeholder;
    
    // Usamos UTC para evitar que o fuso horário mude o dia (comum em strings YYYY-MM-DD)
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return placeholder;
  }
};

/**
 * Utilitário para aplicar máscara de data (DD/MM/AAAA) em campos de entrada (inputs)
 */
export const maskDate = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d+?)$/, '$1');
};