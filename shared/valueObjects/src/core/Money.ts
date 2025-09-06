import { BaseValueObject, ValidationError } from '../BaseValueObject.js';

export type Currency = 'USD' | 'EUR' | 'GBP';

export interface MoneyValue {
  amount: number;
  currency: Currency;
}

/**
 * Money Value Object
 * 
 * Represents monetary values with amount and currency.
 * Provides mathematical operations and validation.
 */
export class Money extends BaseValueObject<MoneyValue> {
  constructor(amount: number, currency: Currency = 'USD') {
    super({ amount, currency });
  }

  protected override validate(value: MoneyValue): void {
    super.validate(value);
    
    if (value.amount < 0) {
      throw new ValidationError('Amount cannot be negative');
    }
    
    if (!this.isValidCurrency(value.currency)) {
      throw new ValidationError(`Unsupported currency: ${value.currency}`);
    }
    
    if (!Number.isFinite(value.amount)) {
      throw new ValidationError('Amount must be a finite number');
    }
  }

  protected override normalize(value: MoneyValue): MoneyValue {
    return {
      amount: parseFloat(value.amount.toFixed(2)),
      currency: value.currency
    };
  }

  get amount(): number {
    return this._value.amount;
  }

  get currency(): Currency {
    return this._value.currency;
  }

  /**
   * Add another Money value
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new ValidationError(`Cannot add different currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract another Money value
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new ValidationError(`Cannot subtract different currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new ValidationError('Multiplication factor cannot be negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  /**
   * Check if this Money is greater than another
   */
  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new ValidationError(`Cannot compare different currencies: ${this.currency} and ${other.currency}`);
    }
    return this.amount > other.amount;
  }

  /**
   * Check if this Money is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Format as string
   */
  override toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  /**
   * Convert to JSON
   */
  override toJSON(): MoneyValue {
    return this._value;
  }

  /**
   * Create from database value
   */
  static fromDatabase(value: number, currency: Currency = 'USD'): Money {
    return new Money(value, currency);
  }

  private isValidCurrency(currency: string): currency is Currency {
    return ['USD', 'EUR', 'GBP'].includes(currency);
  }
}
