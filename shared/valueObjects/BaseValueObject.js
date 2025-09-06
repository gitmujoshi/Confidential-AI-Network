/**
 * Base Value Object Class
 * 
 * All Value Objects should extend this class to ensure consistent behavior.
 * Value Objects are immutable and self-validating.
 */
export class BaseValueObject {
  constructor(value) {
    this.validate(value);
    this._value = this.normalize(value);
  }

  get value() {
    return this._value;
  }

  /**
   * Validate the input value
   * Override in subclasses
   */
  validate(value) {
    if (value === null || value === undefined) {
      throw new ValidationError('Value cannot be null or undefined');
    }
  }

  /**
   * Normalize the input value
   * Override in subclasses if needed
   */
  normalize(value) {
    return value;
  }

  /**
   * Check if this Value Object equals another
   */
  equals(other) {
    return this.constructor === other.constructor && 
           this.value === other.value;
  }

  /**
   * String representation
   */
  toString() {
    return this.value.toString();
  }

  /**
   * JSON representation
   */
  toJSON() {
    return this.value;
  }

  /**
   * Factory method for creating from database values
   * Override in subclasses if needed
   */
  static fromDatabase(value) {
    return new this(value);
  }
}

/**
 * Custom Validation Error
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
