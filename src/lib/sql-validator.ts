/**
 * SQL Query Validator
 * CRITICAL: Validates SQL queries to prevent injection attacks
 * Based on Cloudflare Workers PRP v6 patterns
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Dangerous SQL keywords that should be blocked
const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'SHUTDOWN',
  'INSERT', // Only allow through execute_database tool
  'UPDATE', // Only allow through execute_database tool
];

// Patterns that indicate potential injection attempts
const INJECTION_PATTERNS = [
  /;\s*--/,              // SQL comment after statement
  /\bOR\b.*=.*\bOR\b/i,  // OR 1=1 patterns
  /\bUNION\b.*\bSELECT\b/i, // UNION attacks
  /\bEXEC\b.*\(/i,       // Execute stored procedures
  /\bxp_\w+/i,           // SQL Server extended procedures
  /\bsp_\w+/i,           // SQL Server system procedures
];

/**
 * Validates a SQL query for safety
 * @param sql The SQL query to validate
 * @param allowWrite Whether to allow write operations (for execute_database)
 * @returns Validation result with error message if invalid
 */
export function validateSqlQuery(sql: string, allowWrite: boolean = false): ValidationResult {
  if (!sql || typeof sql !== 'string') {
    return { isValid: false, error: 'Invalid SQL query: must be a non-empty string' };
  }

  const upperSql = sql.toUpperCase().trim();
  
  // Check for multiple statements (prevent stacked queries)
  const statementCount = (sql.match(/;/g) || []).length;
  if (statementCount > 1) {
    return { isValid: false, error: 'Multiple SQL statements not allowed' };
  }

  // Check for dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Skip INSERT/UPDATE checks if writes are allowed
    if (allowWrite && (keyword === 'INSERT' || keyword === 'UPDATE')) {
      continue;
    }
    
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return { 
        isValid: false, 
        error: `Dangerous SQL keyword detected: ${keyword}. This operation is not permitted.` 
      };
    }
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      return { 
        isValid: false, 
        error: 'Potential SQL injection pattern detected. Query blocked for security.' 
      };
    }
  }

  // Additional validation for SELECT queries
  if (upperSql.startsWith('SELECT')) {
    // Ensure it's a read-only query
    if (!allowWrite && /\b(INTO|INSERT|UPDATE|DELETE)\b/i.test(sql)) {
      return { 
        isValid: false, 
        error: 'Write operations not allowed in SELECT queries' 
      };
    }
  }

  // Check for suspicious comment patterns
  if (/--|\/*|\*\//.test(sql)) {
    return { 
      isValid: false, 
      error: 'SQL comments are not allowed for security reasons' 
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes user input for use in SQL queries
 * @param input The user input to sanitize
 * @returns Sanitized string safe for SQL
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any SQL special characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--/g, '')       // Remove comment dashes
    .replace(/\/\*/g, '')     // Remove comment starts
    .replace(/\*\//g, '')     // Remove comment ends
    .trim();
}

/**
 * Validates table/column names to prevent injection via identifiers
 * @param identifier The identifier to validate
 * @returns Whether the identifier is safe
 */
export function validateIdentifier(identifier: string): boolean {
  // Only allow alphanumeric, underscore, and dash
  return /^[a-zA-Z0-9_-]+$/.test(identifier);
}
