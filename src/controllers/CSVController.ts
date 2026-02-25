import { Request, Response, NextFunction } from 'express';
import { CSVService } from '../services/CSVService';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import container from '../config/container';
import { TYPES } from '../config/types';

export class CSVController {
  private csvService: CSVService;

  constructor() {
    this.csvService = container.get<CSVService>(TYPES.CSVService);
  }

  upload = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await this.csvService.uploadCSV(file, req.user.id);
      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  };

  getImports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const imports = await this.csvService.getImports(req.user.id);
      res.json(imports);
    } catch (error: any) {
      next(error);
    }
  };

  createMapping = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { csvImportId, name, mappings } = req.body;
      const mapping = await this.csvService.createMapping(csvImportId, name, mappings);
      res.status(201).json(mapping);
    } catch (error: any) {
      next(error);
    }
  };

  getMappings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csvImportId = req.query.csvImportId ? parseInt(req.query.csvImportId as string) : undefined;
      const mappings = await this.csvService.getMappings(csvImportId);
      res.json(mappings);
    } catch (error: any) {
      next(error);
    }
  };

  preview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const importId = parseInt(req.params.importId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const preview = await this.csvService.previewCSV(importId, limit);
      res.json(preview);
    } catch (error: any) {
      next(error);
    }
  };

  processImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const importId = parseInt(req.params.importId);
      const { mappings, companyId, dataType } = req.body;

      if (!mappings || !companyId) {
        res.status(400).json({ error: 'Mappings and companyId are required' });
        return;
      }

      const result = await this.csvService.importCSVData(
        importId,
        mappings,
        companyId,
        dataType
      );

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  };
}

export const mappingValidation = [
  body('csvImportId').isInt().withMessage('Valid CSV import ID is required'),
  body('name').notEmpty().withMessage('Mapping name is required'),
  body('mappings').isObject().withMessage('Mappings must be an object'),
];
