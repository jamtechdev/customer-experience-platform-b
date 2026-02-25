import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { JourneyAnalysisService, TouchpointSatisfaction } from './JourneyAnalysisService';
import { RootCauseService } from './RootCauseService';
import { AIRecommendationService } from './AIRecommendationService';
import RootCause from '../models/RootCause';
import AIRecommendation from '../models/AIRecommendation';

export interface ProcessEnhancementPlan {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  painPoints: string[];
  rootCauses: Array<{
    id: number;
    title: string;
    category: string;
  }>;
  recommendations: Array<{
    id: number;
    title: string;
    description: string;
  }>;
  expectedOutcome: string;
  timeline: string;
  stakeholders: string[];
}

@injectable()
export class ProcessEnhancementService {
  constructor(
    @inject(TYPES.JourneyAnalysisService) private journeyService: JourneyAnalysisService,
    @inject(TYPES.RootCauseService) private rootCauseService: RootCauseService,
    @inject(TYPES.AIRecommendationService) private recommendationService: AIRecommendationService
  ) {}

  /**
   * Generate comprehensive process enhancement plan
   */
  async generateEnhancementPlan(companyId: number): Promise<ProcessEnhancementPlan[]> {
    // Get pain points from journey analysis
    const touchpointAnalysis = await this.journeyService.analyzeTouchpoints(companyId);
    const painPoints = touchpointAnalysis
      .filter(tp => tp.isPainPoint)
      .map(tp => `${tp.touchpoint.name}: ${tp.dissatisfactionScore.toFixed(2)} dissatisfaction score`);

    // Get root causes
    const rootCauses = await this.rootCauseService.getRootCauses(companyId);

    // Get recommendations
    const recommendations = await this.recommendationService.getRecommendations(companyId);

    // Group by category and priority
    const plans: ProcessEnhancementPlan[] = [];

    // Group root causes by category
    const rootCausesByCategory = new Map<string, RootCause[]>();
    for (const rc of rootCauses) {
      const category = rc.category || 'other';
      if (!rootCausesByCategory.has(category)) {
        rootCausesByCategory.set(category, []);
      }
      rootCausesByCategory.get(category)!.push(rc);
    }

    // Create enhancement plans for each category
    for (const [category, categoryRootCauses] of rootCausesByCategory.entries()) {
      // Find related recommendations
      const categoryRecommendations = recommendations.filter(
        rec => rec.category === category || 
        categoryRootCauses.some(rc => rc.category === rec.category)
      );

      if (categoryRootCauses.length === 0 && categoryRecommendations.length === 0) {
        continue;
      }

      // Determine priority based on root cause priorities
      const maxPriority = categoryRootCauses.length > 0
        ? this.getMaxPriority(categoryRootCauses.map(rc => rc.priority))
        : 'medium';

      // Determine impact and effort
      const impact = this.calculateImpact(categoryRootCauses, categoryRecommendations);
      const effort = this.calculateEffort(categoryRecommendations);

      // Get pain points related to this category
      const categoryPainPoints = this.filterPainPointsByCategory(painPoints, category);

      const plan: ProcessEnhancementPlan = {
        id: `plan-${category}-${Date.now()}`,
        title: this.generatePlanTitle(category),
        description: this.generatePlanDescription(category, categoryRootCauses, categoryPainPoints),
        priority: maxPriority as 'low' | 'medium' | 'high' | 'critical',
        category,
        impact,
        effort,
        painPoints: categoryPainPoints.slice(0, 5),
        rootCauses: categoryRootCauses.slice(0, 5).map(rc => ({
          id: rc.id,
          title: rc.title,
          category: rc.category,
        })),
        recommendations: categoryRecommendations.slice(0, 5).map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
        })),
        expectedOutcome: this.generateExpectedOutcome(category, impact),
        timeline: this.estimateTimeline(effort, categoryRootCauses.length),
        stakeholders: this.identifyStakeholders(category),
      };

      plans.push(plan);
    }

    // Sort by priority and impact
    plans.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    return plans;
  }

  /**
   * Generate enhancement plan for specific touchpoint
   */
  async generateTouchpointEnhancementPlan(
    companyId: number,
    touchpointId: number
  ): Promise<ProcessEnhancementPlan | null> {
    const touchpointAnalysis = await this.journeyService.analyzeTouchpoints(companyId);
    const touchpoint = touchpointAnalysis.find(tp => tp.touchpoint.id === touchpointId);

    if (!touchpoint || !touchpoint.isPainPoint) {
      return null;
    }

    // Get root causes related to this touchpoint
    const rootCauses = await RootCause.findAll({
      where: { touchpointId },
      order: [['priority', 'DESC']],
    });

    // Get recommendations
    const recommendations = await AIRecommendation.findAll({
      include: [
        {
          model: RootCause,
          where: { touchpointId },
          required: false,
        },
      ],
      order: [['priority', 'DESC']],
    });

    const plan: ProcessEnhancementPlan = {
      id: `plan-touchpoint-${touchpointId}-${Date.now()}`,
      title: `Enhance ${touchpoint.touchpoint.name} Experience`,
      description: `Improve customer experience at ${touchpoint.touchpoint.name} touchpoint. Current dissatisfaction score: ${touchpoint.dissatisfactionScore.toFixed(2)}`,
      priority: touchpoint.dissatisfactionScore > 0.7 ? 'critical' : touchpoint.dissatisfactionScore > 0.5 ? 'high' : 'medium',
      category: touchpoint.touchpoint.category,
      impact: 'high',
      effort: recommendations.length > 0 ? (recommendations[0].effort as 'low' | 'medium' | 'high') : 'medium',
      painPoints: [`${touchpoint.touchpoint.name}: High negative feedback (${touchpoint.negativeCount} negative, ${touchpoint.positiveCount} positive)`],
      rootCauses: rootCauses.slice(0, 5).map(rc => ({
        id: rc.id,
        title: rc.title,
        category: rc.category,
      })),
      recommendations: recommendations.slice(0, 5).map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
      })),
      expectedOutcome: `Reduce dissatisfaction at ${touchpoint.touchpoint.name} by improving identified pain points`,
      timeline: this.estimateTimeline(recommendations.length > 0 ? recommendations[0].effort : 'medium', rootCauses.length),
      stakeholders: this.identifyStakeholders(touchpoint.touchpoint.category),
    };

    return plan;
  }

  private getMaxPriority(priorities: string[]): string {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    let maxPriority = 'low';
    let maxValue = 0;

    for (const priority of priorities) {
      const value = priorityOrder[priority as keyof typeof priorityOrder] || 0;
      if (value > maxValue) {
        maxValue = value;
        maxPriority = priority;
      }
    }

    return maxPriority;
  }

  private calculateImpact(
    rootCauses: RootCause[],
    recommendations: AIRecommendation[]
  ): 'low' | 'medium' | 'high' {
    if (rootCauses.length === 0 && recommendations.length === 0) {
      return 'medium';
    }

    // Count high priority root causes
    const highPriorityCount = rootCauses.filter(rc => 
      rc.priority === 'critical' || rc.priority === 'high'
    ).length;

    // Check recommendation impacts
    const highImpactCount = recommendations.filter(rec => 
      rec.impact === 'high'
    ).length;

    if (highPriorityCount >= 3 || highImpactCount >= 2) {
      return 'high';
    } else if (highPriorityCount >= 1 || highImpactCount >= 1) {
      return 'medium';
    }

    return 'low';
  }

  private calculateEffort(recommendations: AIRecommendation[]): 'low' | 'medium' | 'high' {
    if (recommendations.length === 0) {
      return 'medium';
    }

    const effortCounts: { low: number; medium: number; high: number } = { low: 0, medium: 0, high: 0 };
    for (const rec of recommendations) {
      const effort = rec.effort as 'low' | 'medium' | 'high';
      if (effort === 'low' || effort === 'medium' || effort === 'high') {
        effortCounts[effort]++;
      }
    }

    if (effortCounts.high >= effortCounts.medium && effortCounts.high >= effortCounts.low) {
      return 'high';
    } else if (effortCounts.medium >= effortCounts.low) {
      return 'medium';
    }

    return 'low';
  }

  private filterPainPointsByCategory(painPoints: string[], category: string): string[] {
    const categoryKeywords: Record<string, string[]> = {
      product: ['product', 'item', 'quality'],
      service: ['service', 'staff', 'employee'],
      support: ['support', 'help', 'assistance'],
      pricing: ['price', 'cost', 'expensive'],
      delivery: ['delivery', 'shipping', 'arrived'],
    };

    const keywords = categoryKeywords[category] || [];
    return painPoints.filter(pp => 
      keywords.some(keyword => pp.toLowerCase().includes(keyword))
    );
  }

  private generatePlanTitle(category: string): string {
    const titles: Record<string, string> = {
      product: 'Product Quality Enhancement Plan',
      service: 'Customer Service Improvement Plan',
      support: 'Support Process Optimization Plan',
      pricing: 'Pricing Strategy Review Plan',
      delivery: 'Delivery Process Enhancement Plan',
      other: 'General Process Improvement Plan',
    };

    return titles[category] || titles.other;
  }

  private generatePlanDescription(
    category: string,
    rootCauses: RootCause[],
    painPoints: string[]
  ): string {
    let description = `Comprehensive improvement plan for ${category} category. `;
    
    if (rootCauses.length > 0) {
      description += `Identified ${rootCauses.length} root cause(s): ${rootCauses.slice(0, 3).map(rc => rc.title).join(', ')}. `;
    }

    if (painPoints.length > 0) {
      description += `Key pain points: ${painPoints.slice(0, 2).join('; ')}.`;
    }

    return description;
  }

  private generateExpectedOutcome(category: string, impact: string): string {
    const outcomes: Record<string, Record<string, string>> = {
      product: {
        high: 'Significant improvement in product quality perception and reduction in product-related complaints',
        medium: 'Moderate improvement in product satisfaction and fewer quality issues',
        low: 'Incremental improvements in product-related customer feedback',
      },
      service: {
        high: 'Major enhancement in customer service experience and increased satisfaction scores',
        medium: 'Noticeable improvement in service quality and customer interactions',
        low: 'Gradual improvement in service-related metrics',
      },
      support: {
        high: 'Dramatic reduction in support response times and improved resolution rates',
        medium: 'Better support efficiency and customer satisfaction with support interactions',
        low: 'Incremental support process improvements',
      },
      pricing: {
        high: 'Improved pricing competitiveness and better value perception',
        medium: 'More balanced pricing strategy and customer value alignment',
        low: 'Minor pricing adjustments and value communication improvements',
      },
      delivery: {
        high: 'Faster, more reliable delivery and improved logistics performance',
        medium: 'Better delivery experience and reduced shipping issues',
        low: 'Gradual delivery process improvements',
      },
    };

    return outcomes[category]?.[impact] || outcomes.other?.[impact] || 'Improved customer experience in this category';
  }

  private estimateTimeline(effort: string, rootCauseCount: number): string {
    const baseTimeline: Record<string, string> = {
      low: '2-4 weeks',
      medium: '1-3 months',
      high: '3-6 months',
    };

    const base = baseTimeline[effort] || baseTimeline.medium;

    if (rootCauseCount > 5) {
      return `Extended ${base} (complex due to multiple root causes)`;
    }

    return base;
  }

  private identifyStakeholders(category: string): string[] {
    const stakeholders: Record<string, string[]> = {
      product: ['Product Manager', 'Quality Assurance Team', 'Engineering Team'],
      service: ['Customer Service Manager', 'Service Team', 'Training Department'],
      support: ['Support Manager', 'IT Team', 'Customer Success Team'],
      pricing: ['Pricing Manager', 'Finance Team', 'Sales Team'],
      delivery: ['Logistics Manager', 'Operations Team', 'Warehouse Team'],
    };

    return stakeholders[category] || ['Process Owner', 'Management Team'];
  }
}
