import {
  parseItauSms,
  parseBradescoSms,
  parseNubankSms,
  parseBankSms,
  identifyBank,
} from './sms.parser';

describe('SMS Parser', () => {
  describe('identifyBank', () => {
    it('deve identificar Itaú', () => {
      const result = identifyBank('Compra aprovada no Itaú');
      expect(result).toBe('itau');
    });

    it('deve identificar Bradesco', () => {
      const result = identifyBank('Transacao Bradesco');
      expect(result).toBe('bradesco');
    });

    it('deve identificar Nubank', () => {
      const result = identifyBank('Compra Nubank');
      expect(result).toBe('nubank');
    });

    it('deve retornar unknown para banco desconhecido', () => {
      const result = identifyBank('Banco XYZ fez algo');
      expect(result).toBe('unknown');
    });
  });

  describe('parseItauSms', () => {
    it('deve extrair valor, estabelecimento e data', () => {
      const message =
        'Compra aprovada de R$ 150,50 em PADARIA DO JOAO em 25/12/23 14:30';
      const result = parseItauSms(message);

      expect(result.bank).toBe('itau');
      expect(result.amount).toBe(150.5);
      expect(result.establishment).toBe('PADARIA DO JOAO');
      expect(result.parsed).toBe(true);
    });

    it('deve extrair apenas valor e estabelecimento sem data', () => {
      const message = 'Compra aprovada de R$ 89,99 em MERCADO CENTER';
      const result = parseItauSms(message);

      expect(result.bank).toBe('itau');
      expect(result.amount).toBe(89.99);
      expect(result.establishment).toBe('MERCADO CENTER');
      expect(result.parsed).toBe(true);
    });

    it('deve falhar com mensagem inválida', () => {
      const message = 'Mensagem inválida';
      const result = parseItauSms(message);

      expect(result.parsed).toBe(false);
    });
  });

  describe('parseBradescoSms', () => {
    it('deve extrair valor, estabelecimento e data', () => {
      const message = 'Transacao de R$ 250,00 com CINEMA MULTIPLEX em 25/12/2023';
      const result = parseBradescoSms(message);

      expect(result.bank).toBe('bradesco');
      expect(result.amount).toBe(250);
      expect(result.establishment).toBe('CINEMA MULTIPLEX');
      expect(result.parsed).toBe(true);
    });

    it('deve extrair valor e estabelecimento sem data', () => {
      const message = 'Transacao de R$ 45,80 com RESTAURANTE ITALIA';
      const result = parseBradescoSms(message);

      expect(result.bank).toBe('bradesco');
      expect(result.amount).toBe(45.8);
      expect(result.establishment).toBe('RESTAURANTE ITALIA');
      expect(result.parsed).toBe(true);
    });
  });

  describe('parseNubankSms', () => {
    it('deve extrair valor e estabelecimento', () => {
      const message = 'Compra no Itau de R$ 320,00 em UBER';
      const result = parseNubankSms(message);

      expect(result.bank).toBe('nubank');
      expect(result.amount).toBe(320);
      expect(result.establishment).toBe('UBER');
      expect(result.parsed).toBe(true);
    });

    it('deve extrair apenas valor', () => {
      const message = 'Compra de R$ 75,50';
      const result = parseNubankSms(message);

      expect(result.bank).toBe('nubank');
      expect(result.amount).toBe(75.5);
      expect(result.parsed).toBe(true);
    });
  });

  describe('parseBankSms', () => {
    it('deve rotear para parseItauSms', () => {
      const message = 'Compra aprovada de R$ 100,00 em LOJA ITAU em 20/01/24';
      const result = parseBankSms(message);

      expect(result.bank).toBe('itau');
      expect(result.amount).toBe(100);
      expect(result.parsed).toBe(true);
    });

    it('deve rotear para parseBradescoSms', () => {
      const message = 'Transacao de R$ 200,50 com BRADESCO STORE em 20/01/2024';
      const result = parseBankSms(message);

      expect(result.bank).toBe('bradesco');
      expect(result.amount).toBe(200.5);
      expect(result.parsed).toBe(true);
    });

    it('deve rotear para parseNubankSms', () => {
      const message = 'Compra no Nubank de R$ 150,00 em IFOOD';
      const result = parseBankSms(message);

      expect(result.bank).toBe('nubank');
      expect(result.amount).toBe(150);
      expect(result.parsed).toBe(true);
    });

    it('deve retornar unknown para banco não suportado', () => {
      const message = 'Mensagem aleatória sem identificação de banco';
      const result = parseBankSms(message);

      expect(result.bank).toBe('unknown');
      expect(result.parsed).toBe(false);
    });
  });
});
