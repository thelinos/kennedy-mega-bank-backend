export const ACCOUNT_TYPES = ['checking', 'savings'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = ['credit', 'debit'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const MAX_MINOR_UNITS = 9_223_372_036_854_775_807n;

/**
 * MoneyUtil - Exact parsing and formatting using each currency's minor-unit precision.
 */
export class MoneyUtil {
  static currencyDigits(currency: unknown): number | null {
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
      return null;
    }

    if (!Intl.supportedValuesOf('currency').includes(currency)) {
      return null;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? null;
  }

  static parsePositiveAmount(value: unknown, currency: string): bigint | null {
    const digits = this.currencyDigits(currency);
    if (digits === null) {
      return null;
    }

    const amount = typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';

    const pattern = digits === 0
      ? /^\d+$/
      : new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`);
    if (!pattern.test(amount)) {
      return null;
    }

    const [whole, fraction = ''] = amount.split('.');
    const scale = 10n ** BigInt(digits);
    const minorUnits = BigInt(whole) * scale + BigInt(fraction.padEnd(digits, '0') || '0');
    return minorUnits > 0n && minorUnits <= MAX_MINOR_UNITS ? minorUnits : null;
  }

  static formatAmount(minorUnits: bigint, currency: string): string {
    const digits = this.currencyDigits(currency);
    if (digits === null) {
      throw new Error('Unsupported currency');
    }

    const sign = minorUnits < 0n ? '-' : '';
    const absoluteUnits = minorUnits < 0n ? -minorUnits : minorUnits;
    const scale = 10n ** BigInt(digits);
    const whole = absoluteUnits / scale;
    if (digits === 0) {
      return `${sign}${whole}`;
    }
    const fraction = (absoluteUnits % scale).toString().padStart(digits, '0');
    return `${sign}${whole}.${fraction}`;
  }

  static isAccountType(value: unknown): value is AccountType {
    return typeof value === 'string' && ACCOUNT_TYPES.includes(value as AccountType);
  }

  static isTransactionType(value: unknown): value is TransactionType {
    return typeof value === 'string' && TRANSACTION_TYPES.includes(value as TransactionType);
  }
}
