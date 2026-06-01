import {calculateMod11CheckDigit, parseBoletoCode} from '../src/modules/transactions/utils/boletoParser';

function buildValidBarcode() {
  const baseWithoutDv = ['3419', '1000', '0000001234', '1234567890123456789012345'].join('');
  expect(baseWithoutDv).toHaveLength(43);
  const dv = calculateMod11CheckDigit(`${baseWithoutDv.slice(0, 4)}${baseWithoutDv.slice(4)}`);
  return `${baseWithoutDv.slice(0, 4)}${dv}${baseWithoutDv.slice(4)}`;
}

describe('boletoParser', () => {
  it('parses barcode and digitable line', () => {
    const barcode = buildValidBarcode();
    const parsed = parseBoletoCode(barcode);

    expect(parsed.normalized).toHaveLength(44);
    expect(parsed.barcode).toBe(barcode);
    expect(parsed.digitableLine.replace(/\D/g, '')).toHaveLength(47);
    expect(parsed.amount).toBe(12.34);
    expect(parsed.dueDate).toBe('2000-07-03');
    expect(parsed.isValid).toBe(true);

    const parsedFromLine = parseBoletoCode(parsed.digitableLine);
    expect(parsedFromLine.barcode).toBe(barcode);
    expect(parsedFromLine.amount).toBe(12.34);
    expect(parsedFromLine.dueDate).toBe('2000-07-03');
  });
});