import { injectable, inject } from 'inversify';
import Company from '../models/Company';
import Competitor from '../models/Competitor';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';
import NPSSurvey from '../models/NPSSurvey';
import { Op } from 'sequelize';
import { TYPES } from '../config/types';
import { OfflineAnalysisService } from './OfflineAnalysisService';

export interface CompetitorComparison {
  company: {
    id: number;
    name: string;
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  };
  competitors: Array<{
    id: number;
    name: string;
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  }>;
}

export interface GapAnalysis {
  metric: string;
  companyValue: number;
  competitorValue: number;
  gap: number;
  gapPercentage: number;
  status: 'ahead' | 'behind' | 'equal';
}

export interface TrendComparison {
  period: string;
  company: {
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  };
  competitors: Array<{
    id: number;
    name: string;
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  }>;
}

@injectable()
export class CompetitorAnalysisService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}
  async compareWithCompetitors(companyId: number): Promise<CompetitorComparison> {
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const competitors = await Competitor.findAll({ where: { companyId } });

    // Get company metrics
    const companyMetrics = await this.getCompanyMetrics(companyId);

    // Get competitor metrics
    const competitorMetrics = await Promise.all(
      competitors.map(async (competitor) => {
        const metrics = await this.getCompetitorMetrics(competitor.id);
        return {
          id: competitor.id,
          name: competitor.name,
          ...metrics,
        };
      })
    );

    return {
      company: {
        id: company.id,
        name: company.name,
        ...companyMetrics,
      },
      competitors: competitorMetrics,
    };
  }

  private async getCompanyMetrics(companyId: number): Promise<{
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  }> {
    // Get sentiment score
    const feedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [{ model: SentimentAnalysis }],
    });

    let sentimentScore = 0;
    let sentimentCount = 0;

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        sentimentScore += analysis.score;
        sentimentCount++;
      }
    }

    const avgSentiment = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;

    // Get NPS score
    const npsSurveys = await NPSSurvey.findAll({ where: { companyId } });
    const npsScore = this.calculateNPSFromSurveys(npsSurveys);

    return {
      sentimentScore: Math.round(avgSentiment * 100) / 100,
      npsScore,
      feedbackCount: feedback.length,
    };
  }

  private async getCompetitorMetrics(competitorId: number): Promise<{
    sentimentScore: number;
    npsScore: number;
    feedbackCount: number;
  }> {
    const feedback = await CustomerFeedback.findAll({
      where: { competitorId },
      include: [{ model: SentimentAnalysis }],
    });

    let sentimentScore = 0;
    let sentimentCount = 0;

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        sentimentScore += analysis.score;
        sentimentCount++;
      }
    }

    const avgSentiment = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;

    // For competitors, we might not have NPS data, so return 0
    return {
      sentimentScore: Math.round(avgSentiment * 100) / 100,
      npsScore: 0,
      feedbackCount: feedback.length,
    };
  }

  private calculateNPSFromSurveys(surveys: NPSSurvey[]): number {
    if (surveys.length === 0) return 0;

    const promoters = surveys.filter((s) => s.score >= 9).length;
    const detractors = surveys.filter((s) => s.score <= 6).length;
    const total = surveys.length;

    return Math.round(((promoters - detractors) / total) * 100 * 100) / 100;
  }

  /**
   * Perform gap analysis between company and competitors
   */
  async performGapAnalysis(companyId: number): Promise<GapAnalysis[]> {
    const comparison = await this.compareWithCompetitors(companyId);
    const gaps: GapAnalysis[] = [];

    if (comparison.competitors.length === 0) {
      return gaps;
    }

    // Calculate average competitor metrics
    const avgCompetitorSentiment = comparison.competitors.reduce(
      (sum, c) => sum + c.sentimentScore,
      0
    ) / comparison.competitors.length;

    const avgCompetitorNPS = comparison.competitors.reduce(
      (sum, c) => sum + c.npsScore,
      0
    ) / comparison.competitors.length;

    const avgCompetitorFeedbackCount = comparison.competitors.reduce(
      (sum, c) => sum + c.feedbackCount,
      0
    ) / comparison.competitors.length;

    // Sentiment gap
    const sentimentGap = comparison.company.sentimentScore - avgCompetitorSentiment;
    gaps.push({
      metric: 'Sentiment Score',
      companyValue: comparison.company.sentimentScore,
      competitorValue: avgCompetitorSentiment,
      gap: Math.round(sentimentGap * 100) / 100,
      gapPercentage: avgCompetitorSentiment !== 0 
        ? Math.round((sentimentGap / avgCompetitorSentiment) * 100 * 100) / 100 
        : 0,
      status: sentimentGap > 0.1 ? 'ahead' : sentimentGap < -0.1 ? 'behind' : 'equal',
    });

    // NPS gap
    const npsGap = comparison.company.npsScore - avgCompetitorNPS;
    gaps.push({
      metric: 'NPS Score',
      companyValue: comparison.company.npsScore,
      competitorValue: avgCompetitorNPS,
      gap: Math.round(npsGap * 100) / 100,
      gapPercentage: avgCompetitorNPS !== 0 
        ? Math.round((npsGap / avgCompetitorNPS) * 100 * 100) / 100 
        : 0,
      status: npsGap > 5 ? 'ahead' : npsGap < -5 ? 'behind' : 'equal',
    });

    // Feedback volume gap
    const volumeGap = comparison.company.feedbackCount - avgCompetitorFeedbackCount;
    gaps.push({
      metric: 'Feedback Volume',
      companyValue: comparison.company.feedbackCount,
      competitorValue: avgCompetitorFeedbackCount,
      gap: Math.round(volumeGap * 100) / 100,
      gapPercentage: avgCompetitorFeedbackCount > 0 
        ? Math.round((volumeGap / avgCompetitorFeedbackCount) * 100 * 100) / 100 
        : 0,
      status: volumeGap > 0 ? 'ahead' : volumeGap < 0 ? 'behind' : 'equal',
    });

    return gaps;
  }

  /**
   * Compare trends over time
   */
  async compareTrends(
    companyId: number,
    period: 'day' | 'week' | 'month' = 'month',
    days: number = 30
  ): Promise<TrendComparison[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const competitors = await Competitor.findAll({ where: { companyId } });

    // Group feedback by period
    const companyFeedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [Op.gte]: startDate },
      },
      include: [{ model: SentimentAnalysis }],
      order: [['date', 'ASC']],
    });

    const competitorFeedbackMap = new Map<number, CustomerFeedback[]>();
    for (const competitor of competitors) {
      const feedback = await CustomerFeedback.findAll({
        where: {
          competitorId: competitor.id,
          date: { [Op.gte]: startDate },
        },
        include: [{ model: SentimentAnalysis }],
        order: [['date', 'ASC']],
      });
      competitorFeedbackMap.set(competitor.id, feedback);
    }

    // Group by period
    const periodMap = new Map<string, {
      company: { feedback: CustomerFeedback[]; surveys: NPSSurvey[] };
      competitors: Map<number, { feedback: CustomerFeedback[] }>;
    }>();

    // Group company feedback
    for (const feedback of companyFeedback) {
      const periodKey = this.getPeriodKey(feedback.date, period);
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          company: { feedback: [], surveys: [] },
          competitors: new Map(),
        });
      }
      periodMap.get(periodKey)!.company.feedback.push(feedback);
    }

    // Group company NPS surveys
    const companySurveys = await NPSSurvey.findAll({
      where: {
        companyId,
        date: { [Op.gte]: startDate },
      },
      order: [['date', 'ASC']],
    });
    for (const survey of companySurveys) {
      const periodKey = this.getPeriodKey(survey.date, period);
      if (periodMap.has(periodKey)) {
        periodMap.get(periodKey)!.company.surveys.push(survey);
      }
    }

    // Group competitor feedback
    for (const [competitorId, feedback] of competitorFeedbackMap.entries()) {
      for (const f of feedback) {
        const periodKey = this.getPeriodKey(f.date, period);
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, {
            company: { feedback: [], surveys: [] },
            competitors: new Map(),
          });
        }
        if (!periodMap.get(periodKey)!.competitors.has(competitorId)) {
          periodMap.get(periodKey)!.competitors.set(competitorId, { feedback: [] });
        }
        periodMap.get(periodKey)!.competitors.get(competitorId)!.feedback.push(f);
      }
    }

    // Convert to result format
    const trends: TrendComparison[] = [];
    for (const [periodKey, data] of periodMap.entries()) {
      // Calculate company metrics
      let companySentimentScore = 0;
      let companySentimentCount = 0;
      for (const f of data.company.feedback) {
        const analysis = (f as any).SentimentAnalysis;
        if (analysis) {
          companySentimentScore += analysis.score;
          companySentimentCount++;
        }
      }
      const avgCompanySentiment = companySentimentCount > 0 
        ? companySentimentScore / companySentimentCount 
        : 0;
      const companyNPS = this.calculateNPSFromSurveys(data.company.surveys);

      // Calculate competitor metrics
      const competitorMetrics = [];
      for (const competitor of competitors) {
        const competitorData = data.competitors.get(competitor.id);
        if (competitorData) {
          let sentimentScore = 0;
          let sentimentCount = 0;
          for (const f of competitorData.feedback) {
            const analysis = (f as any).SentimentAnalysis;
            if (analysis) {
              sentimentScore += analysis.score;
              sentimentCount++;
            }
          }
          const avgSentiment = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;

          competitorMetrics.push({
            id: competitor.id,
            name: competitor.name,
            sentimentScore: Math.round(avgSentiment * 100) / 100,
            npsScore: 0, // Competitors typically don't have NPS data
            feedbackCount: competitorData.feedback.length,
          });
        }
      }

      trends.push({
        period: periodKey,
        company: {
          sentimentScore: Math.round(avgCompanySentiment * 100) / 100,
          npsScore: companyNPS,
          feedbackCount: data.company.feedback.length,
        },
        competitors: competitorMetrics,
      });
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: 'day' | 'week' | 'month'): string {
    if (period === 'day') {
      return date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }
}
