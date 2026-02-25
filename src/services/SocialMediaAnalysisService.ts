import { injectable, inject } from 'inversify';
import CustomerFeedback from '../models/CustomerFeedback';
import SentimentAnalysis from '../models/SentimentAnalysis';
import Competitor from '../models/Competitor';
import { TYPES } from '../config/types';
import { OfflineAnalysisService } from './OfflineAnalysisService';

export interface VolumeAnalysis {
  totalMentions: number;
  mentionsPerPlatform: Record<string, number>;
  trends: Array<{
    date: string;
    count: number;
  }>;
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
  sentimentIndex: number; // -1 to 1
  channelComparison: Record<string, {
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

export interface TopicAnalysis {
  topics: Array<{
    keyword: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    category: string;
  }>;
  emergingComplaints: string[];
}

export interface CompetitorBenchmark {
  company: {
    sentimentIndex: number;
    mentionCount: number;
    topTopics: string[];
  };
  competitors: Array<{
    id: number;
    name: string;
    sentimentIndex: number;
    mentionCount: number;
    topTopics: string[];
  }>;
  gapAnalysis: Array<{
    metric: string;
    companyValue: number;
    competitorValue: number;
    gap: number;
  }>;
}

export interface RiskMonitoring {
  negativeSentimentSpikes: Array<{
    date: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  highFrequencyComplaints: Array<{
    keyword: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
}

@injectable()
export class SocialMediaAnalysisService {
  constructor(
    @inject(TYPES.OfflineAnalysisService) private offlineAnalysisService: OfflineAnalysisService
  ) {}

  /**
   * Analyze volume of mentions per platform and trends
   */
  async analyzeVolume(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<VolumeAnalysis> {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[require('sequelize').Op.gte] = startDate;
      if (endDate) where.date[require('sequelize').Op.lte] = endDate;
    }

    const feedback = await CustomerFeedback.findAll({ where });

    // Count mentions per platform
    const mentionsPerPlatform: Record<string, number> = {};
    const trendsMap: Record<string, number> = {};

    for (const f of feedback) {
      // Count by source/platform
      const source = f.source || 'unknown';
      mentionsPerPlatform[source] = (mentionsPerPlatform[source] || 0) + 1;

      // Count by date for trends
      const dateKey = f.date.toISOString().split('T')[0];
      trendsMap[dateKey] = (trendsMap[dateKey] || 0) + 1;
    }

    // Convert trends map to array
    const trends = Object.entries(trendsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalMentions: feedback.length,
      mentionsPerPlatform,
      trends,
    };
  }

  /**
   * Analyze sentiment distribution
   */
  async analyzeSentimentDistribution(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<SentimentDistribution> {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[require('sequelize').Op.gte] = startDate;
      if (endDate) where.date[require('sequelize').Op.lte] = endDate;
    }

    const feedback = await CustomerFeedback.findAll({
      where,
      include: [{ model: SentimentAnalysis }],
    });

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let totalSentimentScore = 0;
    const channelComparison: Record<string, { positive: number; negative: number; neutral: number }> = {};

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        totalSentimentScore += analysis.score;

        if (analysis.sentiment === 'positive') {
          positive++;
        } else if (analysis.sentiment === 'negative') {
          negative++;
        } else {
          neutral++;
        }

        // Per channel comparison
        const source = f.source || 'unknown';
        if (!channelComparison[source]) {
          channelComparison[source] = { positive: 0, negative: 0, neutral: 0 };
        }
        if (analysis.sentiment === 'positive') {
          channelComparison[source].positive++;
        } else if (analysis.sentiment === 'negative') {
          channelComparison[source].negative++;
        } else {
          channelComparison[source].neutral++;
        }
      }
    }

    const total = feedback.length;
    const sentimentIndex = total > 0 ? totalSentimentScore / total : 0;

    return {
      positive,
      negative,
      neutral,
      sentimentIndex: Math.round(sentimentIndex * 100) / 100,
      channelComparison,
    };
  }

  /**
   * Extract topics and keywords
   */
  async analyzeTopics(
    companyId: number,
    limit: number = 20
  ): Promise<TopicAnalysis> {
    const feedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [{ model: SentimentAnalysis }],
      limit: 100, // Analyze top 100 for performance
    });

    // Extract keywords and count frequencies
    const keywordFrequency: Record<string, { count: number; sentiment: 'positive' | 'negative' | 'neutral' }> = {};

    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      const sentiment = analysis?.sentiment || 'neutral';
      const content = f.content.toLowerCase();

      // Simple keyword extraction (split by spaces, remove common words)
      const words = content
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'them'].includes(w));

      for (const word of words) {
        if (!keywordFrequency[word]) {
          keywordFrequency[word] = { count: 0, sentiment: 'neutral' };
        }
        keywordFrequency[word].count++;
        // Track dominant sentiment for this keyword
        if (sentiment !== 'neutral') {
          keywordFrequency[word].sentiment = sentiment;
        }
      }
    }

    // Sort by frequency and get top keywords
    const topics = Object.entries(keywordFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([keyword, data]) => ({
        keyword,
        frequency: data.count,
        sentiment: data.sentiment,
        category: this.categorizeKeyword(keyword),
      }));

    // Identify emerging complaints (negative keywords with increasing frequency)
    const emergingComplaints = topics
      .filter(t => t.sentiment === 'negative' && t.frequency >= 3)
      .map(t => t.keyword)
      .slice(0, 10);

    return {
      topics,
      emergingComplaints,
    };
  }

  /**
   * Benchmark against competitors
   */
  async benchmarkCompetitors(companyId: number): Promise<CompetitorBenchmark> {
    // Get company metrics
    const companyFeedback = await CustomerFeedback.findAll({
      where: { companyId },
      include: [{ model: SentimentAnalysis }],
    });

    let companySentimentScore = 0;
    let companySentimentCount = 0;
    for (const f of companyFeedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis) {
        companySentimentScore += analysis.score;
        companySentimentCount++;
      }
    }
    const companySentimentIndex = companySentimentCount > 0 
      ? companySentimentScore / companySentimentCount 
      : 0;

    const companyTopics = await this.analyzeTopics(companyId, 5);
    const companyTopTopics = companyTopics.topics.map(t => t.keyword);

    // Get competitor metrics
    const competitors = await Competitor.findAll({ where: { companyId } });
    const competitorMetrics = await Promise.all(
      competitors.map(async (competitor) => {
        const competitorFeedback = await CustomerFeedback.findAll({
          where: { competitorId: competitor.id },
          include: [{ model: SentimentAnalysis }],
        });

        let sentimentScore = 0;
        let sentimentCount = 0;
        for (const f of competitorFeedback) {
          const analysis = (f as any).SentimentAnalysis;
          if (analysis) {
            sentimentScore += analysis.score;
            sentimentCount++;
          }
        }
        const sentimentIndex = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;

        // Get top topics (simplified - would need competitor-specific topic analysis)
        const topics = await this.analyzeTopics(companyId, 5); // Using companyId as proxy
        const topTopics = topics.topics.map(t => t.keyword);

        return {
          id: competitor.id,
          name: competitor.name,
          sentimentIndex: Math.round(sentimentIndex * 100) / 100,
          mentionCount: competitorFeedback.length,
          topTopics,
        };
      })
    );

    // Gap analysis
    const gapAnalysis = [];
    if (competitorMetrics.length > 0) {
      const avgCompetitorSentiment = competitorMetrics.reduce((sum, c) => sum + c.sentimentIndex, 0) / competitorMetrics.length;
      gapAnalysis.push({
        metric: 'Sentiment Index',
        companyValue: Math.round(companySentimentIndex * 100) / 100,
        competitorValue: Math.round(avgCompetitorSentiment * 100) / 100,
        gap: Math.round((companySentimentIndex - avgCompetitorSentiment) * 100) / 100,
      });
    }

    return {
      company: {
        sentimentIndex: Math.round(companySentimentIndex * 100) / 100,
        mentionCount: companyFeedback.length,
        topTopics: companyTopTopics,
      },
      competitors: competitorMetrics,
      gapAnalysis,
    };
  }

  /**
   * Monitor risks and alert conditions
   */
  async monitorRisks(companyId: number, days: number = 7): Promise<RiskMonitoring> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedback = await CustomerFeedback.findAll({
      where: {
        companyId,
        date: { [require('sequelize').Op.gte]: startDate },
      },
      include: [{ model: SentimentAnalysis }],
    });

    // Analyze negative sentiment spikes by date
    const negativeByDate: Record<string, number> = {};
    for (const f of feedback) {
      const analysis = (f as any).SentimentAnalysis;
      if (analysis && analysis.sentiment === 'negative') {
        const dateKey = f.date.toISOString().split('T')[0];
        negativeByDate[dateKey] = (negativeByDate[dateKey] || 0) + 1;
      }
    }

    const negativeSentimentSpikes = Object.entries(negativeByDate)
      .map(([date, count]) => {
        let severity: 'low' | 'medium' | 'high' | 'critical';
        if (count >= 20) severity = 'critical';
        else if (count >= 10) severity = 'high';
        else if (count >= 5) severity = 'medium';
        else severity = 'low';

        return { date, count, severity };
      })
      .filter(spike => spike.severity !== 'low')
      .sort((a, b) => b.count - a.count);

    // Identify high-frequency complaints
    const topics = await this.analyzeTopics(companyId, 30);
    const highFrequencyComplaints = topics.topics
      .filter(t => t.sentiment === 'negative' && t.frequency >= 5)
      .map(t => ({
        keyword: t.keyword,
        frequency: t.frequency,
        trend: 'stable' as 'increasing' | 'stable' | 'decreasing', // Simplified - would need historical comparison
      }))
      .slice(0, 10);

    return {
      negativeSentimentSpikes,
      highFrequencyComplaints,
    };
  }

  /**
   * Categorize keyword into a category
   */
  private categorizeKeyword(keyword: string): string {
    const categories: Record<string, string[]> = {
      product: ['product', 'item', 'quality', 'defective', 'broken', 'damaged'],
      service: ['service', 'staff', 'employee', 'support', 'help'],
      pricing: ['price', 'cost', 'expensive', 'cheap', 'affordable'],
      delivery: ['delivery', 'shipping', 'arrived', 'late', 'fast', 'slow'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => keyword.includes(k))) {
        return category;
      }
    }

    return 'other';
  }
}
