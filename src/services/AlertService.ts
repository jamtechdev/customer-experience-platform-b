import { injectable, inject } from 'inversify';
import Alert from '../models/Alert';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';
import NPSSurvey from '../models/NPSSurvey';
import { AlertPriority } from '../config/constants';
import { Op } from 'sequelize';
import { TYPES } from '../config/types';
import { NPSService } from './NPSService';
import { CompetitorAnalysisService } from './CompetitorAnalysisService';

export interface AlertThresholds {
  sentimentDropThreshold: number; // Percentage drop in sentiment
  npsDeclineThreshold: number; // Absolute NPS drop
  complaintSpikeThreshold: number; // Number of complaints in time period
  competitorOutperformThreshold: number; // Sentiment gap threshold
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  sentimentDropThreshold: 20, // 20% drop
  npsDeclineThreshold: 10, // 10 point drop
  complaintSpikeThreshold: 10, // 10 complaints in 24 hours
  competitorOutperformThreshold: 0.2, // 0.2 sentiment score gap
};

@injectable()
export class AlertService {
  constructor(
    @inject(TYPES.NPSService) private npsService: NPSService,
    @inject(TYPES.CompetitorAnalysisService) private competitorService: CompetitorAnalysisService
  ) {}
  async createAlert(data: {
    title: string;
    message: string;
    priority: AlertPriority;
    type: string;
  }): Promise<Alert> {
    return await Alert.create({
      ...data,
      acknowledged: false,
    });
  }

  async checkForAlerts(
    companyId: number,
    thresholds: AlertThresholds = DEFAULT_THRESHOLDS
  ): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    // 1. Check for sentiment drop
    const sentimentDropAlert = await this.checkSentimentDrop(companyId, thresholds);
    if (sentimentDropAlert) {
      newAlerts.push(sentimentDropAlert);
    }

    // 2. Check for NPS decline
    const npsDeclineAlert = await this.checkNPSDecline(companyId, thresholds);
    if (npsDeclineAlert) {
      newAlerts.push(npsDeclineAlert);
    }

    // 3. Check for complaint spike
    const complaintSpikeAlert = await this.checkComplaintSpike(companyId, thresholds);
    if (complaintSpikeAlert) {
      newAlerts.push(complaintSpikeAlert);
    }

    // 4. Check for competitor outperform
    const competitorAlert = await this.checkCompetitorOutperform(companyId, thresholds);
    if (competitorAlert) {
      newAlerts.push(competitorAlert);
    }

    // 5. Check for critical negative sentiment
    const criticalSentimentAlert = await this.checkCriticalSentiment(companyId);
    if (criticalSentimentAlert) {
      newAlerts.push(criticalSentimentAlert);
    }

    return newAlerts;
  }

  private async checkSentimentDrop(
    companyId: number,
    thresholds: AlertThresholds
  ): Promise<Alert | null> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get current week sentiment
    const currentFeedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [Op.gte]: lastWeek },
      },
      include: [{ model: SentimentAnalysis }],
    });

    let currentSentiment = 0;
    let currentCount = 0;
    for (const f of currentFeedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        currentSentiment += analysis.score;
        currentCount++;
      }
    }
    const currentAvg = currentCount > 0 ? currentSentiment / currentCount : 0;

    // Get previous week sentiment
    const previousFeedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [Op.gte]: twoWeeksAgo, [Op.lt]: lastWeek },
      },
      include: [{ model: SentimentAnalysis }],
    });

    let previousSentiment = 0;
    let previousCount = 0;
    for (const f of previousFeedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        previousSentiment += analysis.score;
        previousCount++;
      }
    }
    const previousAvg = previousCount > 0 ? previousSentiment / previousCount : 0;

    if (previousAvg > 0 && currentAvg < previousAvg) {
      const dropPercentage = ((previousAvg - currentAvg) / previousAvg) * 100;
      if (dropPercentage >= thresholds.sentimentDropThreshold) {
        const existingAlert = await Alert.findOne({
          where: {
            type: 'sentiment_drop',
            acknowledged: false,
          },
        });

        if (!existingAlert) {
          return await this.createAlert({
            title: 'Significant Sentiment Drop Detected',
            message: `Sentiment dropped by ${Math.round(dropPercentage)}% compared to previous period. Current: ${Math.round(currentAvg * 100) / 100}, Previous: ${Math.round(previousAvg * 100) / 100}`,
            priority: dropPercentage >= 40 ? AlertPriority.CRITICAL : dropPercentage >= 30 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
            type: 'sentiment_drop',
          });
        }
      }
    }

    return null;
  }

  private async checkNPSDecline(
    companyId: number,
    thresholds: AlertThresholds
  ): Promise<Alert | null> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get current NPS
    const currentNPS = await this.npsService.calculateNPS(companyId, lastWeek, now);

    // Get previous NPS
    const previousNPS = await this.npsService.calculateNPS(companyId, twoWeeksAgo, lastWeek);

    const npsDrop = previousNPS.npsScore - currentNPS.npsScore;
    if (npsDrop >= thresholds.npsDeclineThreshold) {
      const existingAlert = await Alert.findOne({
        where: {
          type: 'nps_decline',
          acknowledged: false,
        },
      });

      if (!existingAlert) {
        return await this.createAlert({
          title: 'NPS Score Decline Detected',
          message: `NPS dropped by ${Math.round(npsDrop)} points. Current: ${Math.round(currentNPS.npsScore)}, Previous: ${Math.round(previousNPS.npsScore)}`,
          priority: npsDrop >= 20 ? AlertPriority.CRITICAL : npsDrop >= 15 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
          type: 'nps_decline',
        });
      }
    }

    return null;
  }

  private async checkComplaintSpike(
    companyId: number,
    thresholds: AlertThresholds
  ): Promise<Alert | null> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const complaints = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [Op.gte]: last24Hours },
      },
      include: [
        {
          model: SentimentAnalysis,
          where: { sentiment: 'negative' },
          required: true,
        },
      ],
    });

    if (complaints.length >= thresholds.complaintSpikeThreshold) {
      const existingAlert = await Alert.findOne({
        where: {
          type: 'complaint_spike',
          acknowledged: false,
        },
      });

      if (!existingAlert) {
        return await this.createAlert({
          title: 'Complaint Spike Detected',
          message: `Found ${complaints.length} negative feedback items in the last 24 hours (threshold: ${thresholds.complaintSpikeThreshold})`,
          priority: complaints.length >= 20 ? AlertPriority.CRITICAL : complaints.length >= 15 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
          type: 'complaint_spike',
        });
      }
    }

    return null;
  }

  private async checkCompetitorOutperform(
    companyId: number,
    thresholds: AlertThresholds
  ): Promise<Alert | null> {
    const gaps = await this.competitorService.performGapAnalysis(companyId);
    
    const sentimentGap = gaps.find(g => g.metric === 'Sentiment Score');
    if (sentimentGap && sentimentGap.status === 'behind' && Math.abs(sentimentGap.gap) >= thresholds.competitorOutperformThreshold) {
      const existingAlert = await Alert.findOne({
        where: {
          type: 'competitor_outperform',
          acknowledged: false,
        },
      });

      if (!existingAlert) {
        return await this.createAlert({
          title: 'Competitors Outperforming',
          message: `Competitors are outperforming in sentiment by ${Math.abs(sentimentGap.gap).toFixed(2)} points. Company: ${sentimentGap.companyValue}, Competitors: ${sentimentGap.competitorValue}`,
          priority: Math.abs(sentimentGap.gap) >= 0.5 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
          type: 'competitor_outperform',
        });
      }
    }

    return null;
  }

  private async checkCriticalSentiment(companyId: number): Promise<Alert | null> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const criticalFeedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [Op.gte]: last24Hours },
      },
      include: [
        {
          model: SentimentAnalysis,
          where: {
            sentiment: 'negative',
            score: { [Op.lt]: -0.7 },
          },
          required: true,
        },
      ],
    });

    if (criticalFeedback.length >= 5) {
      const existingAlert = await Alert.findOne({
        where: {
          type: 'critical_sentiment',
          acknowledged: false,
        },
      });

      if (!existingAlert) {
        return await this.createAlert({
          title: 'Critical Negative Sentiment Detected',
          message: `Found ${criticalFeedback.length} highly negative feedback items (score < -0.7) in the last 24 hours`,
          priority: AlertPriority.CRITICAL,
          type: 'critical_sentiment',
        });
      }
    }

    return null;
  }

  async getAlerts(acknowledged?: boolean): Promise<Alert[]> {
    const where: any = {};
    if (acknowledged !== undefined) {
      where.acknowledged = acknowledged;
    }

    return await Alert.findAll({
      where,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async acknowledgeAlert(alertId: number, userId: number): Promise<Alert> {
    const alert = await Alert.findByPk(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    await alert.save();

    return alert;
  }
}
