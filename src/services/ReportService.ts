import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { SentimentAnalysisService } from './SentimentAnalysisService';
import { NPSService } from './NPSService';
import { CompetitorAnalysisService } from './CompetitorAnalysisService';
import { RootCauseService } from './RootCauseService';
import { JourneyAnalysisService } from './JourneyAnalysisService';
import { AlertService } from './AlertService';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';

@injectable()
export class ReportService {
  constructor(
    @inject(TYPES.SentimentAnalysisService) private sentimentService: SentimentAnalysisService,
    @inject(TYPES.NPSService) private npsService: NPSService,
    @inject(TYPES.CompetitorAnalysisService) private competitorService: CompetitorAnalysisService,
    @inject(TYPES.RootCauseService) private rootCauseService: RootCauseService,
    @inject(TYPES.JourneyAnalysisService) private journeyService: JourneyAnalysisService,
    @inject(TYPES.AlertService) private alertService: AlertService
  ) {}

  /**
   * Generate comprehensive PDF report
   */
  async generatePDFReport(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(20).text('Customer Experience Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        if (startDate || endDate) {
          doc.text(
            `Period: ${startDate?.toLocaleDateString() || 'N/A'} - ${endDate?.toLocaleDateString() || 'N/A'}`,
            { align: 'center' }
          );
        }
        doc.moveDown(2);

        // Executive Summary
        doc.fontSize(16).text('Executive Summary', { underline: true });
        doc.moveDown();

        // Sentiment Overview
        const sentimentStats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
        doc.fontSize(14).text('Sentiment Analysis', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Feedback: ${sentimentStats.total}`);
        doc.text(`Positive: ${sentimentStats.positive} (${((sentimentStats.positive / sentimentStats.total) * 100).toFixed(1)}%)`);
        doc.text(`Negative: ${sentimentStats.negative} (${((sentimentStats.negative / sentimentStats.total) * 100).toFixed(1)}%)`);
        doc.text(`Neutral: ${sentimentStats.neutral} (${((sentimentStats.neutral / sentimentStats.total) * 100).toFixed(1)}%)`);
        doc.text(`Average Sentiment Score: ${sentimentStats.averageScore.toFixed(2)}`);
        doc.moveDown();

        // NPS Score
        const nps = await this.npsService.calculateNPS(companyId, startDate, endDate);
        doc.fontSize(14).text('NPS Score', { underline: true });
        doc.fontSize(10);
        doc.text(`NPS Score: ${nps.npsScore.toFixed(1)}`);
        doc.text(`Promoters: ${nps.promoters} (${((nps.promoters / nps.total) * 100).toFixed(1)}%)`);
        doc.text(`Passives: ${nps.passives} (${((nps.passives / nps.total) * 100).toFixed(1)}%)`);
        doc.text(`Detractors: ${nps.detractors} (${((nps.detractors / nps.total) * 100).toFixed(1)}%)`);
        doc.moveDown();

        // Competitor Comparison
        try {
          const competitorComparison = await this.competitorService.compareWithCompetitors(companyId);
          doc.fontSize(14).text('Competitor Comparison', { underline: true });
          doc.fontSize(10);
          doc.text(`Company Sentiment: ${competitorComparison.company.sentimentScore.toFixed(2)}`);
          doc.text(`Company NPS: ${competitorComparison.company.npsScore.toFixed(1)}`);
          if (competitorComparison.competitors.length > 0) {
            doc.text(`Competitors: ${competitorComparison.competitors.length}`);
            competitorComparison.competitors.forEach((comp, idx) => {
              doc.text(`${idx + 1}. ${comp.name}: Sentiment ${comp.sentimentScore.toFixed(2)}, NPS ${comp.npsScore.toFixed(1)}`);
            });
          }
          doc.moveDown();
        } catch (error) {
          // Ignore competitor errors
        }

        // Root Causes
        const rootCauses = await this.rootCauseService.getRootCauses(companyId);
        if (rootCauses.length > 0) {
          doc.fontSize(14).text('Top Root Causes', { underline: true });
          doc.fontSize(10);
          rootCauses.slice(0, 10).forEach((rc, idx) => {
            doc.text(`${idx + 1}. ${rc.title} (${rc.category}, ${rc.priority} priority)`);
            doc.text(`   ${rc.description.substring(0, 100)}...`);
            doc.moveDown(0.5);
          });
          doc.moveDown();
        }

        // Journey Analysis
        try {
          const journeyAnalysis = await this.journeyService.analyzeJourney(companyId);
          doc.fontSize(14).text('Customer Journey Analysis', { underline: true });
          doc.fontSize(10);
          journeyAnalysis.forEach((stage) => {
            doc.text(`${stage.stage.name}:`);
            doc.text(`  Satisfaction: ${stage.satisfactionScore.toFixed(2)}`);
            doc.text(`  Dissatisfaction: ${stage.dissatisfactionScore.toFixed(2)}`);
            doc.text(`  Feedback Count: ${stage.feedbackCount}`);
            doc.moveDown(0.5);
          });
          doc.moveDown();
        } catch (error) {
          // Ignore journey errors
        }

        // Alerts
        const alerts = await this.alertService.getAlerts(false);
        if (alerts.length > 0) {
          doc.fontSize(14).text('Active Alerts', { underline: true });
          doc.fontSize(10);
          alerts.slice(0, 10).forEach((alert) => {
            doc.text(`${alert.priority.toUpperCase()}: ${alert.title}`);
            doc.text(`  ${alert.message.substring(0, 150)}...`);
            doc.moveDown(0.5);
          });
        }

        doc.end();
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Customer Experience Platform';
    workbook.created = new Date();

    // Sentiment Analysis Sheet
    const sentimentSheet = workbook.addWorksheet('Sentiment Analysis');
    const sentimentStats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
    sentimentSheet.columns = [
      { header: 'Metric', key: 'metric', width: 20 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
    ];
    sentimentSheet.addRow({ metric: 'Total Feedback', value: sentimentStats.total, percentage: '100%' });
    sentimentSheet.addRow({ metric: 'Positive', value: sentimentStats.positive, percentage: `${((sentimentStats.positive / sentimentStats.total) * 100).toFixed(1)}%` });
    sentimentSheet.addRow({ metric: 'Negative', value: sentimentStats.negative, percentage: `${((sentimentStats.negative / sentimentStats.total) * 100).toFixed(1)}%` });
    sentimentSheet.addRow({ metric: 'Neutral', value: sentimentStats.neutral, percentage: `${((sentimentStats.neutral / sentimentStats.total) * 100).toFixed(1)}%` });
    sentimentSheet.addRow({ metric: 'Average Score', value: sentimentStats.averageScore.toFixed(2), percentage: '' });

    // NPS Sheet
    const npsSheet = workbook.addWorksheet('NPS Analysis');
    const nps = await this.npsService.calculateNPS(companyId, startDate, endDate);
    npsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 20 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
    ];
    npsSheet.addRow({ metric: 'NPS Score', count: nps.npsScore.toFixed(1), percentage: '' });
    npsSheet.addRow({ metric: 'Promoters', count: nps.promoters, percentage: `${((nps.promoters / nps.total) * 100).toFixed(1)}%` });
    npsSheet.addRow({ metric: 'Passives', count: nps.passives, percentage: `${((nps.passives / nps.total) * 100).toFixed(1)}%` });
    npsSheet.addRow({ metric: 'Detractors', count: nps.detractors, percentage: `${((nps.detractors / nps.total) * 100).toFixed(1)}%` });
    npsSheet.addRow({ metric: 'Total', count: nps.total, percentage: '100%' });

    // Root Causes Sheet
    const rootCauses = await this.rootCauseService.getRootCauses(companyId);
    if (rootCauses.length > 0) {
      const rootCauseSheet = workbook.addWorksheet('Root Causes');
      rootCauseSheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Description', key: 'description', width: 50 },
      ];
      rootCauses.forEach((rc) => {
        rootCauseSheet.addRow({
          title: rc.title,
          category: rc.category,
          priority: rc.priority,
          description: rc.description,
        });
      });
    }

    // Competitor Comparison Sheet
    try {
      const competitorComparison = await this.competitorService.compareWithCompetitors(companyId);
      const competitorSheet = workbook.addWorksheet('Competitor Comparison');
      competitorSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Sentiment Score', key: 'sentiment', width: 18 },
        { header: 'NPS Score', key: 'nps', width: 15 },
        { header: 'Feedback Count', key: 'count', width: 18 },
      ];
      competitorSheet.addRow({
        name: competitorComparison.company.name,
        sentiment: competitorComparison.company.sentimentScore.toFixed(2),
        nps: competitorComparison.company.npsScore.toFixed(1),
        count: competitorComparison.company.feedbackCount,
      });
      competitorComparison.competitors.forEach((comp) => {
        competitorSheet.addRow({
          name: comp.name,
          sentiment: comp.sentimentScore.toFixed(2),
          nps: comp.npsScore.toFixed(1),
          count: comp.feedbackCount,
        });
      });
    } catch (error) {
      // Ignore competitor errors
    }

    // Journey Analysis Sheet
    try {
      const journeyAnalysis = await this.journeyService.analyzeJourney(companyId);
      if (journeyAnalysis.length > 0) {
        const journeySheet = workbook.addWorksheet('Journey Analysis');
        journeySheet.columns = [
          { header: 'Stage', key: 'stage', width: 25 },
          { header: 'Satisfaction Score', key: 'satisfaction', width: 20 },
          { header: 'Dissatisfaction Score', key: 'dissatisfaction', width: 22 },
          { header: 'Feedback Count', key: 'count', width: 18 },
        ];
        journeyAnalysis.forEach((stage) => {
          journeySheet.addRow({
            stage: stage.stage.name,
            satisfaction: stage.satisfactionScore.toFixed(2),
            dissatisfaction: stage.dissatisfactionScore.toFixed(2),
            count: stage.feedbackCount,
          });
        });
      }
    } catch (error) {
      // Ignore journey errors
    }

    // Alerts Sheet
    const alerts = await this.alertService.getAlerts(false);
    if (alerts.length > 0) {
      const alertSheet = workbook.addWorksheet('Alerts');
      alertSheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Message', key: 'message', width: 50 },
        { header: 'Created', key: 'created', width: 20 },
      ];
      alerts.forEach((alert) => {
        alertSheet.addRow({
          title: alert.title,
          priority: alert.priority,
          type: alert.type,
          message: alert.message,
          created: alert.createdAt.toLocaleString(),
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate executive summary report (simplified version)
   */
  async generateExecutiveSummary(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    sentiment: any;
    nps: any;
    competitor: any;
    rootCauses: any;
    alerts: any;
  }> {
    const sentimentStats = await this.sentimentService.getSentimentStats(companyId, startDate, endDate);
    const nps = await this.npsService.calculateNPS(companyId, startDate, endDate);
    const rootCauses = await this.rootCauseService.getRootCauses(companyId);
    const alerts = await this.alertService.getAlerts(false);

    let competitorSummary = null;
    try {
      const comparison = await this.competitorService.compareWithCompetitors(companyId);
      competitorSummary = {
        company: comparison.company,
        competitorCount: comparison.competitors.length,
      };
    } catch (error) {
      // Ignore
    }

    return {
      sentiment: sentimentStats,
      nps,
      competitor: competitorSummary,
      rootCauses: {
        total: rootCauses.length,
        top5: rootCauses.slice(0, 5),
      },
      alerts: {
        total: alerts.length,
        critical: alerts.filter(a => a.priority === 'critical').length,
      },
    };
  }
}
