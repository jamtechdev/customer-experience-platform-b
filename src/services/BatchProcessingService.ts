import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { SentimentAnalysisService } from './SentimentAnalysisService';
import { RootCauseService } from './RootCauseService';
import { JourneyAnalysisService } from './JourneyAnalysisService';
import { AlertService } from './AlertService';
import CustomerFeedback from '../models/CustomerFeedback';
import logger from '../config/logger';

export interface BatchProcessingProgress {
  total: number;
  processed: number;
  current: string;
  errors: string[];
}

export interface BatchProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  sentimentAnalysisCount: number;
  rootCauseAnalysisCount: number;
  journeyMappingCount: number;
}

@injectable()
export class BatchProcessingService {
  constructor(
    @inject(TYPES.SentimentAnalysisService) private sentimentService: SentimentAnalysisService,
    @inject(TYPES.RootCauseService) private rootCauseService: RootCauseService,
    @inject(TYPES.JourneyAnalysisService) private journeyService: JourneyAnalysisService,
    @inject(TYPES.AlertService) private alertService: AlertService
  ) {}

  /**
   * Process feedback records in batch
   */
  async processFeedbackBatch(
    feedbackIds: number[],
    companyId: number,
    onProgress?: (progress: BatchProcessingProgress) => void
  ): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      sentimentAnalysisCount: 0,
      rootCauseAnalysisCount: 0,
      journeyMappingCount: 0,
    };

    const total = feedbackIds.length;
    let processed = 0;
    const errors: string[] = [];

    logger.info(`Starting batch processing for ${total} feedback records`);

    // Process sentiment analysis in batches
    const sentimentBatchSize = 50;
    for (let i = 0; i < feedbackIds.length; i += sentimentBatchSize) {
      const batch = feedbackIds.slice(i, i + sentimentBatchSize);
      
      try {
        const sentimentResults = await this.sentimentService.analyzeBulk(batch);
        result.sentimentAnalysisCount += sentimentResults.length;
        processed += batch.length;

        if (onProgress) {
          onProgress({
            total,
            processed,
            current: `Processing sentiment analysis: ${processed}/${total}`,
            errors: errors.slice(-5), // Last 5 errors
          });
        }

        logger.info(`Processed sentiment analysis for batch ${i / sentimentBatchSize + 1}`);
      } catch (error: any) {
        const errorMsg = `Failed to process sentiment analysis batch: ${error.message}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error);
        result.failed += batch.length;
      }
    }

    // Process root cause analysis for complaints
    try {
      const complaints = await CustomerFeedback.findAll({
        where: {
          id: feedbackIds,
          companyId,
        },
        include: [
          {
            model: require('../models/SentimentAnalysis').default,
            where: { sentiment: 'negative' },
            required: false,
          },
        ],
      });

      if (complaints.length > 0) {
        const complaintTexts = complaints
          .filter((c: any) => c.SentimentAnalysis && c.SentimentAnalysis.sentiment === 'negative')
          .map((c: CustomerFeedback) => c.content);

        if (complaintTexts.length > 0) {
          try {
            await this.rootCauseService.analyzeComplaints(companyId, complaintTexts);
            result.rootCauseAnalysisCount = complaintTexts.length;
            logger.info(`Processed root cause analysis for ${complaintTexts.length} complaints`);
          } catch (error: any) {
            const errorMsg = `Failed to process root cause analysis: ${error.message}`;
            errors.push(errorMsg);
            logger.error(errorMsg, error);
          }
        }
      }
    } catch (error: any) {
      const errorMsg = `Failed to fetch complaints for root cause analysis: ${error.message}`;
      errors.push(errorMsg);
      logger.error(errorMsg, error);
    }

    // Process journey mapping
    try {
      await this.journeyService.mapFeedbackToJourney(companyId, feedbackIds);
      result.journeyMappingCount = feedbackIds.length;
      logger.info(`Mapped ${feedbackIds.length} feedback records to journey`);
    } catch (error: any) {
      const errorMsg = `Failed to map feedback to journey: ${error.message}`;
      errors.push(errorMsg);
      logger.error(errorMsg, error);
    }

    // Evaluate alerts
    try {
      await this.alertService.checkForAlerts(companyId);
      logger.info(`Evaluated alerts for company ${companyId}`);
    } catch (error: any) {
      const errorMsg = `Failed to evaluate alerts: ${error.message}`;
      errors.push(errorMsg);
      logger.error(errorMsg, error);
    }

    result.processed = processed;
    result.failed = total - processed;
    result.errors = errors;
    result.success = result.failed === 0;

    logger.info(
      `Batch processing completed: ${result.processed} processed, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Process all feedback for a company
   */
  async processCompanyFeedback(
    companyId: number,
    onProgress?: (progress: BatchProcessingProgress) => void
  ): Promise<BatchProcessingResult> {
    const feedback = await CustomerFeedback.findAll({
      where: { companyId },
      attributes: ['id'],
    });

    const feedbackIds = feedback.map((f) => f.id);

    if (feedbackIds.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        sentimentAnalysisCount: 0,
        rootCauseAnalysisCount: 0,
        journeyMappingCount: 0,
      };
    }

    return this.processFeedbackBatch(feedbackIds, companyId, onProgress);
  }
}
