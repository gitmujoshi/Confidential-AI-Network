import { BaseValueObject, ValidationError } from '../BaseValueObject.js';

/**
 * Contract ID Value Object
 * 
 * Validates contract ID format and ensures it follows the RICARDIAN- prefix pattern.
 */
export class ContractId extends BaseValueObject<string> {
  protected override validate(value: string): void {
    super.validate(value);
    
    const stringValue = value.toString();
    
    if (!stringValue.startsWith('RICARDIAN-')) {
      throw new ValidationError('Contract ID must start with RICARDIAN-');
    }
    
    if (stringValue.length < 15) {
      throw new ValidationError('Contract ID must be at least 15 characters long');
    }
    
    // Check for valid characters (alphanumeric, hyphens, underscores)
    if (!/^RICARDIAN-[a-zA-Z0-9_-]+$/.test(stringValue)) {
      throw new ValidationError('Contract ID contains invalid characters');
    }
  }

  protected override normalize(value: string): string {
    return value.toString();
  }

  /**
   * Generate a new Contract ID
   */
  static generate(): ContractId {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return new ContractId(`RICARDIAN-${timestamp}-${random}`);
  }
}
