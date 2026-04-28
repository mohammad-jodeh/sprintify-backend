import { Request, Response, NextFunction } from "express";
import xss from "xss";

/**
 * Middleware to sanitize user inputs and prevent XSS attacks
 * Strips dangerous HTML/JavaScript from string fields
 * 
 * @remarks
 * - Applied to request body and query parameters
 * - Preserves data structure while removing malicious content
 * - Only sanitizes string values, leaves arrays/objects intact
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize request body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters (in-place, don't reassign)
  if (req.query && typeof req.query === "object") {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = xss(req.query[key] as string, {
          whiteList: {}, // No HTML tags allowed
        });
      }
    }
  }

  // Sanitize URL parameters (in-place, don't reassign)
  if (req.params && typeof req.params === "object") {
    for (const key in req.params) {
      if (typeof req.params[key] === "string") {
        req.params[key] = xss(req.params[key], {
          whiteList: {}, // No HTML tags allowed
        });
      }
    }
  }

  next();
};

/**
 * Recursively sanitize all string values in an object
 * @param obj - The object to sanitize
 * @returns Sanitized object with same structure
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    // Use XSS library to remove dangerous HTML/JS
    return xss(obj, {
      whiteList: {}, // No HTML tags allowed
    });
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  // Return as-is for numbers, booleans, null, undefined
  return obj;
}
