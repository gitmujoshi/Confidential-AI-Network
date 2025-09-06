import { BaseValueObject, ValidationError } from '../BaseValueObject.js';

export type DurationUnit = 'DAYS' | 'HOURS' | 'MINUTES';

export interface DurationValue {
  value: number;
  unit: DurationUnit;
}

/**
 * Duration Value Object
 * 
 * Represents time durations with value and unit.
 * Provides conversion and validation.
 */
export class Duration extends BaseValueObject<DurationValue> {
  constructor(value: number, unit: DurationUnit = 'DAYS') {
    super({ value, unit });
  }

  protected override validate(value: DurationValue): void {
    super.validate(value);
    
    if (value.value <= 0) {
      throw new ValidationError('Duration must be positive');
    }
    
    if (!Number.isInteger(value.value)) {
      throw new ValidationError('Duration value must be an integer');
    }
    
    if (!this.isValidUnit(value.unit)) {
      throw new ValidationError(`Invalid duration unit: ${value.unit}`);
    }
  }

  protected override normalize(value: DurationValue): DurationValue {
    return {
      value: Math.floor(value.value),
      unit: value.unit
    };
  }

  get durationValue(): number {
    return this._value.value;
  }

  get unit(): DurationUnit {
    return this._value.unit;
  }

  /**
   * Convert to days
   */
  toDays(): number {
    switch (this.unit) {
      case 'DAYS':
        return this.durationValue;
      case 'HOURS':
        return this.durationValue / 24;
      case 'MINUTES':
        return this.durationValue / (24 * 60);
      default:
        return this.durationValue;
    }
  }

  /**
   * Convert to hours
   */
  toHours(): number {
    switch (this.unit) {
      case 'DAYS':
        return this.durationValue * 24;
      case 'HOURS':
        return this.durationValue;
      case 'MINUTES':
        return this.durationValue / 60;
      default:
        return this.durationValue;
    }
  }

  /**
   * Convert to minutes
   */
  toMinutes(): number {
    switch (this.unit) {
      case 'DAYS':
        return this.durationValue * 24 * 60;
      case 'HOURS':
        return this.durationValue * 60;
      case 'MINUTES':
        return this.durationValue;
      default:
        return this.durationValue;
    }
  }

  /**
   * Add another duration
   */
  add(other: Duration): Duration {
    // Convert both to days for addition
    const thisDays = this.toDays();
    const otherDays = other.toDays();
    return new Duration(thisDays + otherDays, 'DAYS');
  }

  /**
   * Check if this duration is longer than another
   */
  isLongerThan(other: Duration): boolean {
    return this.toDays() > other.toDays();
  }

  /**
   * Check if this duration is shorter than another
   */
  isShorterThan(other: Duration): boolean {
    return this.toDays() < other.toDays();
  }

  /**
   * Format as string
   */
  override toString(): string {
    return `${this.durationValue} ${this.unit.toLowerCase()}`;
  }

  /**
   * Convert to JSON
   */
  override toJSON(): DurationValue {
    return this._value;
  }

  /**
   * Create from database value
   */
  static fromDatabase(value: number, unit: DurationUnit = 'DAYS'): Duration {
    return new Duration(value, unit);
  }

  private isValidUnit(unit: string): unit is DurationUnit {
    return ['DAYS', 'HOURS', 'MINUTES'].includes(unit);
  }
}
