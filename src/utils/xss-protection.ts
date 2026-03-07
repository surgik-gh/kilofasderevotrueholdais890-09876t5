/**
 * XSS (Cross-Site Scripting) Protection Utilities
 * Sanitizes HTML and user content to prevent XSS attacks
 * Requirements: 14.3
 */

import DOMPurify from 'dompurify';

/**
 * Configuration for different sanitization levels
 */
export interface SanitizationConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowedSchemes?: string[];
  stripComments?: boolean;
}

/**
 * Predefined sanitization configurations
 */
export const SanitizationPresets = {
  // Strict: Only plain text, no HTML
  STRICT: {
    allowedTags: [],
    allowedAttributes: {},
    stripComments: true
  },

  // Basic: Simple formatting only
  BASIC: {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'br', 'p'],
    allowedAttributes: {},
    stripComments: true
  },

  // Rich: Rich text with links and lists
  RICH: {
    allowedTags: [
      'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'code': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    stripComments: true
  },

  // Educational: For lesson content with images and formatting
  EDUCATIONAL: {
    allowedTags: [
      'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'],
      'div': ['class'],
      'span': ['class'],
      'table': ['class'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan']
    },
    allowedSchemes: ['http', 'https', 'data'],
    stripComments: true
  }
};

/**
 * Sanitizes HTML content using DOMPurify
 */
export function sanitizeHTML(
  html: string,
  config: SanitizationConfig = SanitizationPresets.BASIC
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configure DOMPurify
  const purifyConfig: any = {
    ALLOWED_TAGS: config.allowedTags,
    ALLOWED_ATTR: config.allowedAttributes ? Object.keys(config.allowedAttributes).reduce((acc, tag) => {
      return [...acc, ...(config.allowedAttributes![tag] || [])];
    }, [] as string[]) : [],
    ALLOWED_URI_REGEXP: config.allowedSchemes 
      ? new RegExp(`^(${config.allowedSchemes.join('|')}):`, 'i')
      : /^https?:/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    SAFE_FOR_TEMPLATES: true
  };

  // Sanitize
  const clean = DOMPurify.sanitize(html, purifyConfig);

  return clean;
}

/**
 * Escapes HTML special characters
 * Use this for displaying user input as plain text
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Unescapes HTML entities
 */
export function unescapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlUnescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/'
  };

  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => htmlUnescapeMap[entity]);
}

/**
 * Sanitizes user input for display in attributes
 */
export function sanitizeAttribute(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove any quotes and angle brackets
  return value
    .replace(/[<>"']/g, '')
    .trim();
}

/**
 * Sanitizes URL to prevent javascript: and data: schemes (except for images)
 */
export function sanitizeURL(url: string, allowDataScheme: boolean = false): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  
  for (const scheme of dangerousSchemes) {
    if (trimmedUrl.startsWith(scheme)) {
      // Allow data: scheme for images if specified
      if (scheme === 'data:' && allowDataScheme && trimmedUrl.startsWith('data:image/')) {
        return url.trim();
      }
      return '';
    }
  }

  // Only allow http, https, and mailto
  if (!trimmedUrl.startsWith('http://') && 
      !trimmedUrl.startsWith('https://') && 
      !trimmedUrl.startsWith('mailto:') &&
      !trimmedUrl.startsWith('/')) {
    return '';
  }

  return url.trim();
}

/**
 * Detects potential XSS patterns in text
 */
export function detectXSSPatterns(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /<applet[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,  // Event handlers
    /<img[\s\S]*?onerror[\s\S]*?>/gi,
    /<svg[\s\S]*?onload[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,  // CSS expression
    /<meta[\s\S]*?http-equiv/gi,
    /<link[\s\S]*?href[\s\S]*?javascript:/gi,
    /<style[\s\S]*?>[\s\S]*?<\/style>/gi
  ];

  return xssPatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitizes JSON data to prevent XSS in JSON responses
 */
export function sanitizeJSON<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check if it looks like HTML
      if (value.includes('<') || value.includes('>')) {
        sanitized[key] = sanitizeHTML(value, SanitizationPresets.BASIC);
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' && item !== null ? sanitizeJSON(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeJSON(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitizes markdown content
 * Allows markdown syntax but prevents XSS
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  // First, escape any HTML in the markdown
  let sanitized = markdown;

  // Remove script tags
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Sanitize inline HTML
  sanitized = sanitized.replace(/<[^>]+>/g, (match) => {
    // Allow only safe HTML tags
    const safeTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'code', 'pre', 'a', 'img'];
    const tagMatch = match.match(/<\/?(\w+)/);
    
    if (tagMatch && safeTags.includes(tagMatch[1].toLowerCase())) {
      return sanitizeHTML(match, SanitizationPresets.RICH);
    }
    
    return escapeHTML(match);
  });

  return sanitized;
}

/**
 * Content Security Policy (CSP) header generator
 */
export function generateCSPHeader(options: {
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
} = {}): string {
  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' ${(options.scriptSrc || []).join(' ')}`,
    `style-src 'self' 'unsafe-inline' ${(options.styleSrc || []).join(' ')}`,
    `img-src 'self' data: https: ${(options.imgSrc || []).join(' ')}`,
    `connect-src 'self' ${(options.connectSrc || []).join(' ')}`,
    `font-src 'self' ${(options.fontSrc || []).join(' ')}`,
    `object-src ${(options.objectSrc || ["'none'"]).join(' ')}`,
    `media-src 'self' ${(options.mediaSrc || []).join(' ')}`,
    `frame-src ${(options.frameSrc || ["'none'"]).join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  return directives.join('; ');
}

/**
 * Validates and sanitizes user-generated content
 */
export function sanitizeUserContent(
  content: string,
  contentType: 'text' | 'html' | 'markdown' | 'url' = 'text'
): string {
  switch (contentType) {
    case 'html':
      return sanitizeHTML(content, SanitizationPresets.RICH);
    case 'markdown':
      return sanitizeMarkdown(content);
    case 'url':
      return sanitizeURL(content);
    case 'text':
    default:
      return escapeHTML(content);
  }
}

/**
 * Logs XSS attempt for security monitoring
 */
export function logXSSAttempt(
  userId: string | null,
  content: string,
  context: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    content: content.substring(0, 200), // Limit log size
    context,
    severity: 'HIGH',
    type: 'XSS_ATTEMPT'
  };

  console.error('[SECURITY] XSS Attempt Detected:', logEntry);

  // In production, send to security monitoring service
}

/**
 * Middleware to sanitize all string inputs
 */
export function xssProtectionMiddleware(
  data: Record<string, any>,
  userId: string | null = null
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check for XSS patterns
      if (detectXSSPatterns(value)) {
        logXSSAttempt(userId, value, `Field: ${key}`);
        // Sanitize the content
        sanitized[key] = sanitizeHTML(value, SanitizationPresets.BASIC);
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? xssProtectionMiddleware(item, userId)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = xssProtectionMiddleware(value, userId);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Export utilities
export const XSSProtection = {
  sanitizeHTML,
  escapeHTML,
  unescapeHTML,
  sanitizeAttribute,
  sanitizeURL,
  detectXSSPatterns,
  sanitizeJSON,
  sanitizeMarkdown,
  sanitizeUserContent,
  generateCSPHeader,
  logXSSAttempt,
  xssProtectionMiddleware,
  SanitizationPresets
};
