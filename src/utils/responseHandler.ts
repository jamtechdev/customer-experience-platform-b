import { Response } from 'express';

/**
 * Generate a JSON response for a general error.
 *
 * @param {Response} res - The Express response object.
 * @param {number} code - The HTTP status code.
 * @param {string} message - The error message.
 * @param {any|null} data - Optional additional data.
 * @returns {Response}
 */
export const errorHandler = (res: Response, code: number = 403, message: string | null = null, data: any = null): void => {
  const errorResponse = {
    success: false,
    version: 'v1',
    code: code,
    message: message,
    data: data || {}, // Ensures "data" is always present, even if null
  };
  res.status(code).json(errorResponse);
};

/**
 * Generate a JSON response for an unauthorized error.
 *
 * @param {Response} res - The Express response object.
 * @param {string} message - The error message (default: "Unauthorized").
 * @returns {Response}
 */
export const unauthorizedHandler = (res: Response, message: string = 'Your credentials are incorrect or your account has been blocked by the server administrator.'): void => {
  const response = {
    success: false,
    version: 'v1',
    code: 401,
    message: message,
  };
  res.status(401).json(response);
};

/**
 * Generate a JSON response for a success message.
 *
 * @param {Response} res - The Express response object.
 * @param {any} data - The data to be returned in the response.
 * @param {number} code - The HTTP status code (default: 200).
 * @param {string|null} message - Optional success message.
 * @returns {Response}
 */
export const successHandler = (res: Response, data: any, code: number = 200, message: string | null = null): void => {
  const response = {
    success: true,
    message: message,
    version: 'v1',
    code: code,
    data: data,
  };
  res.status(code).json(response);
};

/**
 * Generate a JSON response for internal server error.
 *
 * @param {Response} res - The Express response object.
 * @param {Error} e - The error object.
 * @param {boolean} isStripe - Optional flag for Stripe errors.
 * @returns {Response}
 */
export const serverErrorHandler = (res: Response, e: Error, isStripe: boolean = false): void => {
  const errorResponse = {
    debug: (process.env.NODE_ENV !== 'production') ? {
      message: e.message,
      line: e.stack,
    } : null,
    message: (!isStripe) ? 'Unable to process your request at this time because the server encountered an unexpected condition.' : e.message,
    version: 'v1',
    code: 500,
  };

  // Log the error for debugging purposes
  console.error('Debug message:', e.message);

  res.status(500).json(errorResponse);
};

/**
 * Generate a JSON response for input validation errors.
 *
 * @param {Response} res - The Express response object.
 * @param {any|null} validationErrors - The validation error object.
 * @returns {Response}
 */
export const validationErrorHandler = (res: Response, validationErrors: any = null): void => {
  const firstError = validationErrors && validationErrors.length > 0 ? validationErrors[0] : null;

  // Directly return message, code, version with the error field and message
  res.status(422).json({
    success: false,
    message: firstError ? firstError.msg : 'Validation failed. Please check your input.',
    code: 422,
    version: 'v1',
    field: firstError ? firstError.path : 'error'
  });
};

/**
 * Generate a JSON response for a "not found" error.
 *
 * @param {Response} res - The Express response object.
 * @param {string} message - The error message.
 * @returns {Response}
 */
export const notFoundHandler = (res: Response, message: string = 'Resource not found. Please check back later or try a different search.'): void => {
  const response = {
    data: [],
    version: 'v1',
    code: 404,
    message: message,
  };
  res.status(404).json(response);
};
