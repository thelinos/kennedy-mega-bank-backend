import { describe, it, expect } from 'vitest';
import { MoneyUtil } from '../../src/shared/utils/money.util.ts';

describe('MoneyUtil', () => {
  it('parses decimal amounts into exact minor units', () => {
    expect(MoneyUtil.parsePositiveAmount(10.12, 'USD')).toBe(1012n);
    expect(MoneyUtil.parsePositiveAmount('0.01', 'USD')).toBe(1n);
    expect(MoneyUtil.parsePositiveAmount(10.126, 'USD')).toBeNull();
    expect(MoneyUtil.parsePositiveAmount('12', 'JPY')).toBe(12n);
    expect(MoneyUtil.parsePositiveAmount('1.234', 'KWD')).toBe(1234n);
    expect(MoneyUtil.parsePositiveAmount('1.2', 'JPY')).toBeNull();
  });

  it('formats minor units without floating-point rounding', () => {
    expect(MoneyUtil.formatAmount(1012n, 'USD')).toBe('10.12');
    expect(MoneyUtil.formatAmount(1n, 'USD')).toBe('0.01');
    expect(MoneyUtil.formatAmount(-5n, 'USD')).toBe('-0.05');
    expect(MoneyUtil.formatAmount(12n, 'JPY')).toBe('12');
    expect(MoneyUtil.formatAmount(1234n, 'KWD')).toBe('1.234');
  });

  it('rejects invalid, non-positive, and out-of-range amounts', () => {
    expect(MoneyUtil.parsePositiveAmount('5', 'USD')).toBe(500n);
    expect(MoneyUtil.parsePositiveAmount(0, 'USD')).toBeNull();
    expect(MoneyUtil.parsePositiveAmount(-1, 'USD')).toBeNull();
    expect(MoneyUtil.parsePositiveAmount('nope', 'USD')).toBeNull();
    expect(MoneyUtil.parsePositiveAmount('1.001', 'USD')).toBeNull();
    expect(MoneyUtil.parsePositiveAmount('92233720368547759.00', 'USD')).toBeNull();
    expect(MoneyUtil.currencyDigits('ZZZ')).toBeNull();
  });
});
