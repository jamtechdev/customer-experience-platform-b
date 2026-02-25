import { Request, Response, NextFunction } from 'express';
import { CSVService } from '../services/CSVService';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import container from '../config/container';
import { TYPES } from '../config/types';
import { AppError } from '../middleware/errorHandler';
import {
  successHandler,
  errorHandler,
  unauthorizedHandler,
  serverErrorHandler,
  validationErrorHandler,
  notFoundHandler,
} from '../utils/responseHandler';

export class CSVController {
  private csvService: CSVService;

  constructor() {
    this.csvService = container.get<CSVService>(TYPES.CSVService);
  }

  upload = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      const file = req.file;
      if (!file) {
        errorHandler(res, 400, 'No file uploaded');
        return;
      }

      const result = await this.csvService.uploadCSV(file, req.user.id);
      successHandler(res, result, 201, 'File uploaded successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getImports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        unauthorizedHandler(res, 'Authentication required');
        return;
      }

      const imports = await this.csvService.getImports(req.user.id);
      successHandler(res, imports, 200, 'Imports retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  createMapping = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const { csvImportId, name, mappings } = req.body;
      const mapping = await this.csvService.createMapping(csvImportId, name, mappings);
      successHandler(res, mapping, 201, 'Mapping created successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  getMappings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csvImportId = req.query.csvImportId ? parseInt(req.query.csvImportId as string) : undefined;
      const mappings = await this.csvService.getMappings(csvImportId);
      successHandler(res, mappings, 200, 'Mappings retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  preview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const importId = parseInt(req.params.importId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const preview = await this.csvService.previewCSV(importId, limit);
      successHandler(res, preview, 200, 'Preview retrieved successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };

  processImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        validationErrorHandler(res, errors.array());
        return;
      }

      const importId = parseInt(req.params.importId);
      const { mappings, companyId, dataType } = req.body;

      if (!mappings || !companyId) {
        errorHandler(res, 400, 'Mappings and companyId are required');
        return;
      }

      const result = await this.csvService.importCSVData(
        importId,
        mappings,
        companyId,
        dataType
      );

      successHandler(res, result, 200, 'CSV data imported successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        errorHandler(res, error.statusCode, error.message);
        return;
      }
      serverErrorHandler(res, error);
    }
  };
}

export const mappingValidation = [
  body('csvImportId').isInt().withMessage('Valid CSV import ID is required'),
  body('name').notEmpty().withMessage('Mapping name is required'),
  body('mappings').isObject().withMessage('Mappings must be an object'),
];
