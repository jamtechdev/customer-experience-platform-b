import { Request, Response, NextFunction } from 'express';
import { SentimentAnalysisService } from '../services/SentimentAnalysisService';
import { NPSService } from '../services/NPSService';
import { AlertService } from '../services/AlertService';
import { CompetitorAnalysisService } from '../services/CompetitorAnalysisService';
import { RootCauseService } from '../services/RootCauseService';
import { JourneyAnalysisService } from '../services/JourneyAnalysisService';
import container from '../config/container';
import { TYPES } from '../config/types';

export class DashboardController {
  private sentimentService: SentimentAnalysisService;
  private npsService: NPSService;
  private alertService: AlertService;
  private competitorService: CompetitorAnalysisService;
  private rootCauseService: RootCauseService;
  private journeyService: JourneyAnalysisService;

  constructor() {
    this.sentimentService = container.get<SentimentAnalysisService>(TYPES.SentimentAnalysisService);
    this.npsService = container.get<NPSService>(TYPES.NPSService);
    this.alertService = container.get<AlertService>(TYPES.AlertService);
    this.competitorService = container.get<CompetitorAnalysisService>(TYPES.CompetitorAnalysisService);
    this.rootCauseService = container.get<RootCauseService>(TYPES.RootCauseService);
    this.journeyService = container.get<JourneyAnalysisService>(TYPES.JourneyAnalysisService);
  }

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Get sentiment stats
      const sentimentStats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);

      // Get NPS score
      let npsScore = 0;
      let npsDetails = { promoters: 0, passives: 0, detractors: 0, total: 0 };
      if (companyId) {
        const nps = await this.npsService.calculateNPS(companyId, startDate, endDate);
        npsScore = nps.npsScore;
        npsDetails = {
          promoters: nps.promoters,
          passives: nps.passives,
          detractors: nps.detractors,
          total: nps.total,
        };
      }

      // Get unacknowledged alerts
      const alerts = await this.alertService.getAlerts(false);
      const criticalAlerts = alerts.filter((a) => a.priority === 'critical').length;
      const highAlerts = alerts.filter((a) => a.priority === 'high').length;

      // Get competitor comparison summary
      let competitorSummary = null;
      if (companyId) {
        try {
          const comparison = await this.competitorService.compareWithCompetitors(companyId);
          competitorSummary = {
            company: comparison.company,
            competitorCount: comparison.competitors.length,
            avgCompetitorSentiment: comparison.competitors.length > 0
              ? comparison.competitors.reduce((sum, c) => sum + c.sentimentScore, 0) / comparison.competitors.length
              : 0,
          };
        } catch (error) {
          // Ignore competitor errors
        }
      }

      // Get root cause summary
      let rootCauseSummary = null;
      if (companyId) {
        try {
          const rootCauses = await this.rootCauseService.getRootCauses(companyId);
          rootCauseSummary = {
            total: rootCauses.length,
            critical: rootCauses.filter(rc => rc.priority === 'critical').length,
            high: rootCauses.filter(rc => rc.priority === 'high').length,
            topCauses: rootCauses.slice(0, 5).map(rc => ({
              id: rc.id,
              title: rc.title,
              category: rc.category,
              priority: rc.priority,
            })),
          };
        } catch (error) {
          // Ignore root cause errors
        }
      }

      // Get journey satisfaction heatmap
      let journeyHeatmap = null;
      if (companyId) {
        try {
          const journeyAnalysis = await this.journeyService.analyzeJourney(companyId);
          journeyHeatmap = journeyAnalysis.map(stage => ({
            stageId: stage.stage.id,
            stageName: stage.stage.name,
            satisfactionScore: stage.satisfactionScore,
            dissatisfactionScore: stage.dissatisfactionScore,
            feedbackCount: stage.feedbackCount,
            painPoints: stage.painPoints,
            satisfactionPoints: stage.satisfactionPoints,
          }));
        } catch (error) {
          // Ignore journey errors
        }
      }

      res.json({
        sentiment: {
          positive: sentimentStats.positive,
          negative: sentimentStats.negative,
          neutral: sentimentStats.neutral,
          averageScore: sentimentStats.averageScore,
          total: sentimentStats.total,
        },
        nps: {
          score: npsScore,
          ...npsDetails,
        },
        alerts: {
          total: alerts.length,
          critical: criticalAlerts,
          high: highAlerts,
          recent: alerts.slice(0, 5),
        },
        competitor: competitorSummary,
        rootCauses: rootCauseSummary,
        journey: journeyHeatmap,
      });
    } catch (error: any) {
      next(error);
    }
  };

  getSentimentOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  };

  getNPSDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const nps = await this.npsService.calculateNPS(companyId, startDate, endDate);
      const trends = await this.npsService.getNPSTrends(companyId, period);

      res.json({
        current: nps,
        trends,
      });
    } catch (error: any) {
      next(error);
    }
  };

  getCompetitorComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const comparison = await this.competitorService.compareWithCompetitors(companyId);
      const gaps = await this.competitorService.performGapAnalysis(companyId);
      const period = (req.query.period as 'day' | 'week' | 'month') || 'month';
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trends = await this.competitorService.compareTrends(companyId, period, days);

      res.json({
        comparison,
        gaps,
        trends,
      });
    } catch (error: any) {
      next(error);
    }
  };

  getRootCauseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const rootCauses = await this.rootCauseService.getRootCauses(companyId);

      const summary = {
        total: rootCauses.length,
        byPriority: {
          critical: rootCauses.filter(rc => rc.priority === 'critical').length,
          high: rootCauses.filter(rc => rc.priority === 'high').length,
          medium: rootCauses.filter(rc => rc.priority === 'medium').length,
          low: rootCauses.filter(rc => rc.priority === 'low').length,
        },
        byCategory: {} as Record<string, number>,
        topCauses: rootCauses.slice(0, 10).map(rc => ({
          id: rc.id,
          title: rc.title,
          category: rc.category,
          priority: rc.priority,
          description: rc.description,
        })),
      };

      // Count by category
      for (const rc of rootCauses) {
        const category = rc.category || 'other';
        summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
      }

      res.json(summary);
    } catch (error: any) {
      next(error);
    }
  };

  getJourneyHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }

      const journeyAnalysis = await this.journeyService.analyzeJourney(companyId);
      const touchpointAnalysis = await this.journeyService.analyzeTouchpoints(companyId);

      res.json({
        stages: journeyAnalysis.map(stage => ({
          stageId: stage.stage.id,
          stageName: stage.stage.name,
          satisfactionScore: stage.satisfactionScore,
          dissatisfactionScore: stage.dissatisfactionScore,
          feedbackCount: stage.feedbackCount,
          painPoints: stage.painPoints,
          satisfactionPoints: stage.satisfactionPoints,
        })),
        touchpoints: touchpointAnalysis.map(tp => ({
          touchpointId: tp.touchpoint.id,
          touchpointName: tp.touchpoint.name,
          satisfactionScore: tp.satisfactionScore,
          dissatisfactionScore: tp.dissatisfactionScore,
          feedbackCount: tp.feedbackCount,
          isPainPoint: tp.isPainPoint,
          positiveCount: tp.positiveCount,
          negativeCount: tp.negativeCount,
        })),
      });
    } catch (error: any) {
      next(error);
    }
  };

  getAlertPanel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const acknowledged = req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined;
      const alerts = await this.alertService.getAlerts(acknowledged);

      const panel = {
        total: alerts.length,
        byPriority: {
          critical: alerts.filter(a => a.priority === 'critical').length,
          high: alerts.filter(a => a.priority === 'high').length,
          medium: alerts.filter(a => a.priority === 'medium').length,
          low: alerts.filter(a => a.priority === 'low').length,
        },
        recent: alerts.slice(0, 10).map(a => ({
          id: a.id,
          title: a.title,
          message: a.message,
          priority: a.priority,
          type: a.type,
          acknowledged: a.acknowledged,
          createdAt: a.createdAt,
        })),
      };

      res.json(panel);
    } catch (error: any) {
      next(error);
    }
  };
}
