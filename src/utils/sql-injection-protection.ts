/**
 * SQL Injection Protection Utilities
 * Ensures all database queries use parameterized queries
 * Requirements: 14.2
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Detects potential SQL injection patterns in strings
 * This is a defense-in-depth measure - parameterized queries are the primary defense
 */
export function detectSQLInjectionPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Common SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|;|\/\*|\*\/)/,  // SQL comments and statement terminators
    /('|")\s*(OR|AND)\s*('|")/i,  // Quote-based injection
    /\bOR\b\s+\d+\s*=\s*\d+/i,  // OR 1=1 style
    /\bAND\b\s+\d+\s*=\s*\d+/i,  // AND 1=1 style
    /\bUNION\b.*\bSELECT\b/i,  // UNION SELECT
    /\bEXEC\b\s*\(/i,  // EXEC(
    /xp_cmdshell/i,  // SQL Server command execution
    /\bINTO\b\s+\bOUTFILE\b/i,  // File operations
    /\bLOAD_FILE\b/i,  // MySQL file reading
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitizes user input by escaping special characters
 * Note: This is NOT a replacement for parameterized queries
 * Use this only for additional safety in specific contexts
 */
export function sanitizeSQLInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/\0/g, '')  // Remove null bytes
    .replace(/\n/g, '\\n')  // Escape newlines
    .replace(/\r/g, '\\r')  // Escape carriage returns
    .replace(/\x1a/g, '\\Z');  // Escape Ctrl+Z
}

/**
 * Validates that a query uses parameterized approach
 * Checks if query contains user input directly concatenated
 */
export function isParameterizedQuery(query: string, userInputs: string[]): boolean {
  // Check if any user input appears directly in the query
  for (const input of userInputs) {
    if (input && query.includes(input)) {
      return false;  // Direct concatenation detected
    }
  }
  return true;
}

/**
 * Safe query builder for Supabase
 * Ensures all queries use the query builder API which is parameterized
 */
export class SafeQueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Safe SELECT query
   */
  async select<T>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>
  ): Promise<T[]> {
    let query = this.supabase.from(table).select(columns);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        // Validate column name doesn't contain SQL injection
        if (detectSQLInjectionPatterns(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  /**
   * Safe INSERT query
   */
  async insert<T>(
    table: string,
    data: Record<string, any> | Record<string, any>[]
  ): Promise<T[]> {
    // Validate table name
    if (detectSQLInjectionPatterns(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    return (result as T[]) || [];
  }

  /**
   * Safe UPDATE query
   */
  async update<T>(
    table: string,
    updates: Record<string, any>,
    filters: Record<string, any>
  ): Promise<T[]> {
    // Validate table name
    if (detectSQLInjectionPatterns(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    let query = this.supabase.from(table).update(updates);

    for (const [key, value] of Object.entries(filters)) {
      if (detectSQLInjectionPatterns(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      query = query.eq(key, value);
    }

    const { data, error } = await query.select();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  /**
   * Safe DELETE query
   */
  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<void> {
    // Validate table name
    if (detectSQLInjectionPatterns(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    let query = this.supabase.from(table).delete();

    for (const [key, value] of Object.entries(filters)) {
      if (detectSQLInjectionPatterns(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      query = query.eq(key, value);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Safe search query with text search
   */
  async search<T>(
    table: string,
    column: string,
    searchTerm: string,
    additionalFilters?: Record<string, any>
  ): Promise<T[]> {
    // Validate inputs
    if (detectSQLInjectionPatterns(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    if (detectSQLInjectionPatterns(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }

    // Use ilike for case-insensitive search (parameterized)
    let query = this.supabase
      .from(table)
      .select('*')
      .ilike(column, `%${searchTerm}%`);

    if (additionalFilters) {
      for (const [key, value] of Object.entries(additionalFilters)) {
        if (detectSQLInjectionPatterns(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return (data as T[]) || [];
  }
}

/**
 * Validates column names to prevent SQL injection through column names
 */
export function validateColumnName(columnName: string): boolean {
  if (!columnName || typeof columnName !== 'string') {
    return false;
  }

  // Column names should only contain alphanumeric characters and underscores
  const validColumnRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  return validColumnRegex.test(columnName) && !detectSQLInjectionPatterns(columnName);
}

/**
 * Validates table names to prevent SQL injection through table names
 */
export function validateTableName(tableName: string): boolean {
  if (!tableName || typeof tableName !== 'string') {
    return false;
  }

  // Table names should only contain alphanumeric characters and underscores
  const validTableRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  return validTableRegex.test(tableName) && !detectSQLInjectionPatterns(tableName);
}

/**
 * Audit function to check if a service uses safe query patterns
 */
export function auditServiceForSQLInjection(serviceCode: string): {
  safe: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for raw SQL queries
  if (serviceCode.includes('.rpc(') && !serviceCode.includes('// SQL injection safe')) {
    issues.push('Found .rpc() call - ensure it uses parameterized queries');
  }

  // Check for string concatenation in queries
  const concatenationPatterns = [
    /\.from\([^)]*\+[^)]*\)/,  // .from('table' + variable)
    /\.select\([^)]*\+[^)]*\)/,  // .select('col' + variable)
    /\.eq\([^)]*\+[^)]*,/,  // .eq('col' + variable, value)
  ];

  for (const pattern of concatenationPatterns) {
    if (pattern.test(serviceCode)) {
      issues.push('Found potential string concatenation in query - use parameterized queries');
    }
  }

  // Check for template literals in queries
  if (serviceCode.includes('.from(`') || serviceCode.includes('.select(`')) {
    issues.push('Found template literal in query - ensure no user input is interpolated');
  }

  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * Logging function for SQL injection attempts
 */
export function logSQLInjectionAttempt(
  userId: string | null,
  input: string,
  context: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    input: input.substring(0, 200), // Limit log size
    context,
    severity: 'HIGH',
    type: 'SQL_INJECTION_ATTEMPT'
  };

  // Log to console (in production, send to logging service)
  console.error('[SECURITY] SQL Injection Attempt Detected:', logEntry);

  // In production, you would send this to a security monitoring service
  // Example: sendToSecurityMonitoring(logEntry);
}

/**
 * Middleware to check all inputs for SQL injection patterns
 */
export function sqlInjectionProtectionMiddleware(
  data: Record<string, any>,
  userId: string | null = null
): void {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && detectSQLInjectionPatterns(value)) {
      logSQLInjectionAttempt(userId, value, `Field: ${key}`);
      throw new Error('Invalid input detected');
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sqlInjectionProtectionMiddleware(value, userId);
    }
  }
}

// Export utilities
export const SQLInjectionProtection = {
  detectSQLInjectionPatterns,
  sanitizeSQLInput,
  isParameterizedQuery,
  validateColumnName,
  validateTableName,
  auditServiceForSQLInjection,
  logSQLInjectionAttempt,
  sqlInjectionProtectionMiddleware,
  SafeQueryBuilder
};
