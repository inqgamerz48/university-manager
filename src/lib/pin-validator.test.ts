
import { validatePIN } from './pin-validator';

describe('PIN Validator', () => {
    test('validates correct PIN', () => {
        const result = validatePIN('23622-CS-001');
        expect(result.valid).toBe(true);
        expect(result.deptCode).toBe('CS');
        expect(result.year).toBe('23');
    });

    test('rejects invalid format', () => {
        const result = validatePIN('invalid-pin');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('rejects invalid department', () => {
        const result = validatePIN('23622-XYZ-001');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid department');
    });

    test('rejects invalid year', () => {
        const result = validatePIN('99622-CS-001'); // 99 not in YEAR_CODES
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid year');
    });
});
