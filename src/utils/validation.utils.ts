/**
 * Centralized Validation Utilities
 * Provides comprehensive validation functions for the AILesson platform
 * Requirements: 14.1
 */

// Email validation using RFC 5322 compliant regex
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true };
}

// Phone validation (international format)
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmedPhone = phone.trim();
  
  if (trimmedPhone.length === 0) {
    return { valid: false, error: 'Phone number cannot be empty' };
  }

  // Remove common formatting characters
  const cleanPhone = trimmedPhone.replace(/[\s\-\(\)\.]/g, '');
  
  // International phone format: optional +, followed by 7-15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Invalid phone number format. Use international format (e.g., +79991234567)' };
  }

  return { valid: true };
}

// URL validation
export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const urlObj = new URL(trimmedUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }

    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return { valid: false, error: 'URL must have a valid hostname' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Numeric range validation
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (value > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true };
}

// String length validation
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedValue = value.trim();
  
  if (trimmedValue.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (trimmedValue.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }

  return { valid: true };
}

// UUID validation
export function validateUUID(uuid: string, fieldName: string = 'ID'): { valid: boolean; error?: string } {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: `${fieldName} must be a valid UUID` };
  }

  return { valid: true };
}

// Grade validation (1-11, техникум, ВУЗ)
export function validateGrade(grade: string): { valid: boolean; error?: string } {
  if (!grade || typeof grade !== 'string') {
    return { valid: false, error: 'Grade is required' };
  }

  const validGrades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'техникум', 'ВУЗ'];
  
  if (!validGrades.includes(grade)) {
    return { valid: false, error: 'Grade must be 1-11, техникум, or ВУЗ' };
  }

  return { valid: true };
}

// Role validation
export function validateRole(role: string): { valid: boolean; error?: string } {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role is required' };
  }

  const validRoles = ['student', 'parent', 'teacher', 'administrator'];
  
  if (!validRoles.includes(role)) {
    return { valid: false, error: 'Role must be student, parent, teacher, or administrator' };
  }

  return { valid: true };
}

// Subject validation
export function validateSubject(subject: string): { valid: boolean; error?: string } {
  if (!subject || typeof subject !== 'string') {
    return { valid: false, error: 'Subject is required' };
  }

  const validSubjects = [
    'Русский',
    'Английский',
    'Математика',
    'Геометрия',
    'Физика',
    'Химия',
    'Биология',
    'История',
    'Обществознание',
    'Информатика',
    'Французский',
    'Немецкий',
    'Итальянский',
    'Корейский',
    'Китайский',
    'Японский'
  ];
  
  if (!validSubjects.includes(subject)) {
    return { valid: false, error: 'Invalid subject' };
  }

  return { valid: true };
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { valid: true };
}

// Duplicate check helper (generic)
export async function checkDuplicate<T>(
  checkFunction: () => Promise<T | null>,
  fieldName: string = 'Record'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const existing = await checkFunction();
    
    if (existing) {
      return { valid: false, error: `${fieldName} already exists` };
    }

    return { valid: true };
  } catch (error) {
    console.error('Duplicate check error:', error);
    return { valid: false, error: 'Failed to check for duplicates' };
  }
}

// Sanitize string input (remove dangerous characters)
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

// Validate and sanitize HTML content
export function validateHTMLContent(content: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: 'Content contains potentially dangerous HTML' };
    }
  }

  return { valid: true, sanitized: content };
}

// Batch validation helper
export function validateFields(
  validations: Array<{ valid: boolean; error?: string }>
): { valid: boolean; errors: string[] } {
  const errors = validations
    .filter(v => !v.valid)
    .map(v => v.error || 'Validation failed')
    .filter((error, index, self) => self.indexOf(error) === index); // Remove duplicates

  return {
    valid: errors.length === 0,
    errors
  };
}

// Connection request type validation
export function validateConnectionRequestType(type: string): { valid: boolean; error?: string } {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Connection request type is required' };
  }

  const validTypes = ['parent_child', 'teacher_school', 'student_school'];
  
  if (!validTypes.includes(type)) {
    return { valid: false, error: 'Invalid connection request type' };
  }

  return { valid: true };
}

// Wisdom coins validation
export function validateWisdomCoins(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Wisdom coins amount must be a valid number' };
  }

  if (amount < 0) {
    return { valid: false, error: 'Wisdom coins amount cannot be negative' };
  }

  if (!Number.isInteger(amount)) {
    return { valid: false, error: 'Wisdom coins amount must be a whole number' };
  }

  if (amount > 1000000) {
    return { valid: false, error: 'Wisdom coins amount is too large' };
  }

  return { valid: true };
}

// Quiz score validation
export function validateQuizScore(score: number): { valid: boolean; error?: string } {
  return validateRange(score, 0, 100, 'Quiz score');
}

// Date validation
export function validateDate(date: string | Date, fieldName: string = 'Date'): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} must be a valid date` };
  }

  return { valid: true };
}

// Future date validation
export function validateFutureDate(date: string | Date, fieldName: string = 'Date'): { valid: boolean; error?: string } {
  const dateValidation = validateDate(date, fieldName);
  if (!dateValidation.valid) {
    return dateValidation;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (dateObj <= now) {
    return { valid: false, error: `${fieldName} must be in the future` };
  }

  return { valid: true };
}

// Export all validators as a namespace for easier imports
export const Validators = {
  email: validateEmail,
  phone: validatePhone,
  url: validateURL,
  range: validateRange,
  length: validateLength,
  uuid: validateUUID,
  grade: validateGrade,
  role: validateRole,
  subject: validateSubject,
  password: validatePassword,
  connectionRequestType: validateConnectionRequestType,
  wisdomCoins: validateWisdomCoins,
  quizScore: validateQuizScore,
  date: validateDate,
  futureDate: validateFutureDate,
  htmlContent: validateHTMLContent,
  checkDuplicate,
  sanitizeString,
  validateFields
};
