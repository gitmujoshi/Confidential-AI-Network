/**
 * Base Value Object Class
 * 
 * All Value Objects should extend this class to ensure consistent behavior.
 * Value Objects are immutable and self-validating.
 */
export abstract class BaseValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = this.normalize(value);
  }

  get value(): T {
    return this._value;
  }

  /**
   * Validate the input value
   * Override in subclasses
   */
  protected validate(value: T): void {
    if (value === null || value === undefined) {
      throw new ValidationError('Value cannot be null or undefined');
    }
  }

  /**
   * Normalize the input value
   * Override in subclasses if needed
   */
  protected normalize(value: T): T {
    return value;
  }

  /**
   * Check if this Value Object equals another
   */
  equals(other: BaseValueObject<T>): boolean {
    return this.constructor === other.constructor && 
           this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return String(this.value);
  }

  /**
   * JSON representation
   */
  toJSON(): T {
    return this.value;
  }
}

/**
 * Custom Validation Error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
