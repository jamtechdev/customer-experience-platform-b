import { injectable } from 'inversify';
import NPSSurvey from '../models/NPSSurvey';
import { Op } from 'sequelize';

export interface NPSStats {
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  total: number;
  averageScore: number;
}

@injectable()
export class NPSService {
  async createSurvey(data: {
    score: number;
    comment?: string;
    customerId?: string;
    companyId: number;
    date: Date;
  }): Promise<NPSSurvey> {
    if (data.score < 0 || data.score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }

    return await NPSSurvey.create(data);
  }

  async calculateNPS(companyId: number, startDate?: Date, endDate?: Date): Promise<NPSStats> {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const surveys = await NPSSurvey.findAll({ where });

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let totalScore = 0;
    const total = surveys.length;

    for (const survey of surveys) {
      totalScore += survey.score;
      if (survey.score >= 9) {
        promoters++;
      } else if (survey.score >= 7) {
        passives++;
      } else {
        detractors++;
      }
    }

    const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : 0;
    const averageScore = total > 0 ? totalScore / total : 0;

    return {
      promoters,
      passives,
      detractors,
      npsScore: Math.round(npsScore * 100) / 100,
      total,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  async getNPSTrends(companyId: number, period: 'day' | 'week' | 'month' = 'month'): Promise<
    Array<{
      period: string;
      npsScore: number;
      count: number;
    }>
  > {
    const surveys = await NPSSurvey.findAll({
      where: { companyId },
      order: [['date', 'ASC']],
    });

    const grouped: Record<string, { scores: number[] }> = {};

    for (const survey of surveys) {
      const date = new Date(survey.date);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { scores: [] };
      }
      grouped[key].scores.push(survey.score);
    }

    return Object.entries(grouped).map(([period, data]) => {
      const total = data.scores.length;
      const promoters = data.scores.filter((s) => s >= 9).length;
      const detractors = data.scores.filter((s) => s <= 6).length;
      const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : 0;

      return {
        period,
        npsScore: Math.round(npsScore * 100) / 100,
        count: total,
      };
    });
  }
}
