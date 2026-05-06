import {calculateBillingPeriod} from './cards.billing.service';

describe('calculateBillingPeriod', () => {
  it('deve retornar período correto quando a data é antes do fechamento', () => {
    const referenceDate = new Date(2024, 4, 5);
    const result = calculateBillingPeriod(15, referenceDate);

    const expectedStart = new Date(2024, 3, 15);
    const expectedEnd = new Date(2024, 4, 15);

    expect(result.startDate.toISOString()).toBe(expectedStart.toISOString());
    expect(result.endDate.toISOString()).toBe(expectedEnd.toISOString());
    expect(result.closingDay).toBe(15);
    expect(result.dueDay).toBe(25);
  });

  it('deve retornar período correto quando a data é depois do fechamento', () => {
    const referenceDate = new Date(2024, 4, 20);
    const result = calculateBillingPeriod(15, referenceDate);

    const expectedStart = new Date(2024, 4, 15);
    const expectedEnd = new Date(2024, 5, 15);

    expect(result.startDate.toISOString()).toBe(expectedStart.toISOString());
    expect(result.endDate.toISOString()).toBe(expectedEnd.toISOString());
  });

  it('deve lidar corretamente com fechamento no dia 30 e mês de fevereiro', () => {
    const referenceDate = new Date(2024, 2, 5);
    const result = calculateBillingPeriod(30, referenceDate);

    const expectedStart = new Date(2024, 1, 29);
    const expectedEnd = new Date(2024, 2, 30);

    expect(result.startDate.getDate()).toBe(29);
    expect(result.startDate.getMonth()).toBe(1);
    expect(result.endDate.getDate()).toBe(30);
    expect(result.endDate.getMonth()).toBe(2);
  });

  it('deve lidar corretamente com fechamento no dia 31', () => {
    const referenceDate = new Date(2024, 1, 10);
    const result = calculateBillingPeriod(31, referenceDate);

    const expectedStart = new Date(2024, 0, 31);
    const expectedEnd = new Date(2024, 1, 29);

    expect(result.startDate.getDate()).toBe(31);
    expect(result.startDate.getMonth()).toBe(0);
    expect(result.endDate.getDate()).toBe(29);
    expect(result.endDate.getMonth()).toBe(1);
  });

  it('deve calcular dueDay corretamente quando closingDay + 10 <= 31', () => {
    const result = calculateBillingPeriod(15);
    expect(result.dueDay).toBe(25);
  });

  it('deve limitar dueDay a 31 quando closingDay + 10 > 31', () => {
    const result = calculateBillingPeriod(25);
    expect(result.dueDay).toBe(31);
  });

  it('deve retornar período com o closingDay e dueDay corretos', () => {
    const referenceDate = new Date(2024, 4, 20);
    const closingDay = 20;
    const result = calculateBillingPeriod(closingDay, referenceDate);

    expect(result.closingDay).toBe(closingDay);
    expect(result.dueDay).toBe(30);
  });

  it('deve retornar datas com hora zero (00:00:00)', () => {
    const result = calculateBillingPeriod(15);

    expect(result.startDate.getHours()).toBe(0);
    expect(result.startDate.getMinutes()).toBe(0);
    expect(result.startDate.getSeconds()).toBe(0);
    expect(result.endDate.getHours()).toBe(0);
    expect(result.endDate.getMinutes()).toBe(0);
    expect(result.endDate.getSeconds()).toBe(0);
  });
});
