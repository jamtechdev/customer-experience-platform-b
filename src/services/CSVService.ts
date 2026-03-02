import { injectable, inject } from 'inversify';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import CSVImport from '../models/CSVImport';
import CSVMapping from '../models/CSVMapping';
import CustomerFeedback from '../models/CustomerFeedback';
import NPSSurvey from '../models/NPSSurvey';
import Company from '../models/Company';
import Competitor from '../models/Competitor';
import { UPLOAD_DIR } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { validateCSV, validateCSVRow, detectCSVType, CSV_SCHEMAS } from '../utils/csvValidator';
import { TYPES } from '../config/types';
import { BatchProcessingService } from './BatchProcessingService';
import logger from '../config/logger';

export interface CSVUploadResult {
  importId: number;
  filename: string;
  rowCount: number;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: string[];
  dataType: 'social_media' | 'app_review' | 'nps_survey' | 'complaint' | 'unknown';
}

@injectable()
export class CSVService {
  constructor(
    @inject(TYPES.BatchProcessingService) private batchProcessingService: BatchProcessingService
  ) {}

  async uploadCSV(file: Express.Multer.File, userId: number): Promise<CSVUploadResult> {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new AppError('Invalid file type. Only CSV files are allowed', 400);
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Count rows
    const rowCount = await this.countCSVRows(filePath);

    // Create import record
    const csvImport = await CSVImport.create({
      filename,
      originalFilename: file.originalname,
      filePath,
      rowCount,
      status: 'pending',
      userId,
    });

    return {
      importId: csvImport.id,
      filename: csvImport.originalFilename,
      rowCount,
    };
  }

  async parseCSV(filePath: string, mappings: Record<string, string>): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          const mappedData: any = {};
          for (const [csvColumn, targetField] of Object.entries(mappings)) {
            if (data[csvColumn] !== undefined) {
              mappedData[targetField] = data[csvColumn];
            }
          }
          results.push(mappedData);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async createMapping(
    csvImportId: number,
    name: string,
    mappings: Record<string, string>
  ): Promise<CSVMapping> {
    const csvImport = await CSVImport.findByPk(csvImportId);
    if (!csvImport) {
      throw new AppError('CSV import not found', 404);
    }

    return await CSVMapping.create({
      csvImportId,
      name,
      mappings,
    });
  }

  async getMappings(csvImportId?: number): Promise<CSVMapping[]> {
    const where = csvImportId ? { csvImportId } : {};
    return await CSVMapping.findAll({ where, include: [{ model: CSVImport }] });
  }

  async getImports(userId?: number): Promise<CSVImport[]> {
    const where = userId ? { userId } : {};
    return await CSVImport.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async getImportById(importId: number, userId?: number): Promise<CSVImport | null> {
    const where: any = { id: importId };
    if (userId) {
      where.userId = userId;
    }
    return await CSVImport.findOne({ where });
  }

  async importCSVData(
    csvImportId: number,
    mappings: Record<string, string>,
    companyId: number,
    dataType?: 'social_media' | 'app_review' | 'nps_survey' | 'complaint'
  ): Promise<ImportResult> {
    const csvImport = await CSVImport.findByPk(csvImportId);
    if (!csvImport) {
      throw new AppError('CSV import not found', 404);
    }

    // Update status to processing
    await csvImport.update({ status: 'processing' });

    const errors: string[] = [];
    let importedCount = 0;
    let failedCount = 0;

    try {
      // Parse CSV with mappings
      const rows = await this.parseCSV(csvImport.filePath, mappings);

      // Detect data type if not provided
      let detectedType: 'social_media' | 'app_review' | 'nps_survey' | 'complaint' | undefined = dataType;
      if (!detectedType && rows.length > 0) {
        const headers = Object.keys(rows[0]);
        const detected = detectCSVType(headers);
        if (detected !== 'unknown') {
          detectedType = detected;
        }
      }

      if (!detectedType) {
        throw new AppError('Could not determine CSV data type. Please specify it manually.', 400);
      }

      // Get or create default company
      let company = await Company.findByPk(companyId);
      if (!company) {
        company = await Company.create({ name: 'Default Company', id: companyId });
      }

      // Track imported feedback IDs for batch processing
      const importedFeedbackIds: number[] = [];

      // Import based on data type
      if (detectedType === 'nps_survey') {
        // Import as NPS surveys
        for (const row of rows) {
          try {
            // Validate row
            const schema = CSV_SCHEMAS[detectedType];
            const validation = validateCSVRow(row, schema);
            if (!validation.valid) {
              errors.push(`Row ${importedCount + failedCount + 1}: ${validation.errors.join(', ')}`);
              failedCount++;
              continue;
            }

            // Parse score (ensure it's 0-10)
            const score = Math.max(0, Math.min(10, parseInt(row.score) || 0));

            // Parse date
            const date = row.date ? new Date(row.date) : new Date();

            await NPSSurvey.create({
              score,
              comment: row.comment || row.feedback || undefined,
              customerId: row.customerId || row.customer_id || undefined,
              companyId: company.id,
              date,
            });

            importedCount++;
          } catch (error: any) {
            errors.push(`Row ${importedCount + failedCount + 1}: ${error.message}`);
            failedCount++;
          }
        }
      } else {
        // Import as CustomerFeedback (social media, app review, complaint)
        for (const row of rows) {
          try {
            // Validate row
            const schema = CSV_SCHEMAS[detectedType];
            const validation = validateCSVRow(row, schema);
            if (!validation.valid) {
              errors.push(`Row ${importedCount + failedCount + 1}: ${validation.errors.join(', ')}`);
              failedCount++;
              continue;
            }

            // Determine if competitor or company
            let competitorId: number | undefined;
            const source = (row.source || '').toLowerCase();
            const isCompetitor = source.includes('competitor') || 
                                 row.competitorId || 
                                 row.competitor_id ||
                                 (row.companyName && row.companyName.toLowerCase() !== company.name.toLowerCase());

            if (isCompetitor && (row.competitorId || row.competitor_id)) {
              competitorId = parseInt(row.competitorId || row.competitor_id);
            } else if (isCompetitor) {
              // Try to find or create competitor
              const competitorName = row.companyName || 'Unknown Competitor';
              let competitor = await Competitor.findOne({ 
                where: { name: competitorName, companyId: company.id } 
              });
              if (!competitor) {
                competitor = await Competitor.create({
                  name: competitorName,
                  companyId: company.id,
                });
              }
              competitorId = competitor.id;
            }

            // Parse date
            const date = row.date ? new Date(row.date) : new Date();

            // Parse rating if available (1-5 scale)
            const rating = row.rating ? Math.max(1, Math.min(5, parseInt(row.rating) || 0)) : undefined;

            const feedback = await CustomerFeedback.create({
              source: row.source || detectedType,
              content: row.content || row.text || row.message || row.comment || '',
              author: row.author || row.user || row.customer || undefined,
              rating,
              date,
              companyId: company.id,
              competitorId: competitorId || undefined,
            });

            importedFeedbackIds.push(feedback.id);
            importedCount++;
          } catch (error: any) {
            errors.push(`Row ${importedCount + failedCount + 1}: ${error.message}`);
            failedCount++;
          }
        }
      }

      // Update import status
      await csvImport.update({
        status: importedCount > 0 ? 'completed' : 'failed',
        errorMessage: errors.length > 0 ? errors.slice(0, 10).join('; ') : undefined,
      });

      // Automatically trigger batch processing for imported feedback
      if (importedFeedbackIds.length > 0 && detectedType !== 'nps_survey') {
        try {
          logger.info(`Starting automatic batch processing for ${importedFeedbackIds.length} feedback records`);
          await this.batchProcessingService.processFeedbackBatch(
            importedFeedbackIds,
            companyId
          );
          logger.info(`Completed automatic batch processing for ${importedFeedbackIds.length} feedback records`);
        } catch (error: any) {
          // Log error but don't fail the import
          logger.error(`Failed to process batch after import: ${error.message}`, error);
          errors.push(`Batch processing failed: ${error.message}`);
        }
      }

      return {
        success: importedCount > 0,
        importedCount,
        failedCount,
        errors: errors.slice(0, 20), // Limit errors returned
        dataType: detectedType,
      };
    } catch (error: any) {
      await csvImport.update({
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError(`CSV import failed: ${error.message}`, 500);
    }
  }

  async previewCSV(csvImportId: number, limit: number = 10): Promise<{
    headers: string[];
    rows: Record<string, any>[];
    rowCount: number;
  }> {
    const csvImport = await CSVImport.findByPk(csvImportId);
    if (!csvImport) {
      throw new AppError('CSV import not found', 404);
    }

    return new Promise((resolve, reject) => {
      const headers: string[] = [];
      const rows: Record<string, any>[] = [];
      let rowCount = 0;
      let isFirstRow = true;

      fs.createReadStream(csvImport.filePath)
        .pipe(csv())
        .on('data', (data) => {
          if (isFirstRow) {
            headers.push(...Object.keys(data));
            isFirstRow = false;
          }
          if (rows.length < limit) {
            rows.push(data);
          }
          rowCount++;
        })
        .on('end', () => {
          resolve({ headers, rows, rowCount });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async countCSVRows(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', () => {
          count++;
        })
        .on('end', () => {
          resolve(count);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
