import { injectable } from 'inversify';
import { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, EMOTION_KEYWORDS, STOP_WORDS } from '../utils/sentimentDictionary';

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  keyPhrases: string[];
  emotions?: Record<string, number>;
}

export interface RootCauseResult {
  rootCauses: Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface RecommendationResult {
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
}

@injectable()
export class OfflineAnalysisService {
  /**
   * Analyze sentiment of text using keyword-based approach
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        keyPhrases: [],
        emotions: {},
      };
    }

    const normalizedText = text.toLowerCase();
    const words = this.tokenize(normalizedText);
    
    let positiveScore = 0;
    let negativeScore = 0;
    const keyPhrases: string[] = [];
    const emotionScores: Record<string, number> = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
    };

    // Analyze each word
    for (const word of words) {
      const cleanWord = this.cleanWord(word);
      if (STOP_WORDS.has(cleanWord) || cleanWord.length < 2) {
        continue;
      }

      // Check positive keywords
      if (POSITIVE_KEYWORDS[cleanWord]) {
        positiveScore += POSITIVE_KEYWORDS[cleanWord];
        if (keyPhrases.length < 5) {
          keyPhrases.push(word);
        }
      }

      // Check negative keywords
      if (NEGATIVE_KEYWORDS[cleanWord]) {
        negativeScore += Math.abs(NEGATIVE_KEYWORDS[cleanWord]);
        if (keyPhrases.length < 5) {
          keyPhrases.push(word);
        }
      }

      // Check emotions
      for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
        if (keywords.includes(cleanWord)) {
          emotionScores[emotion] += 0.2;
        }
      }
    }

    // Calculate final sentiment score (-1 to 1)
    const totalWords = words.filter(w => !STOP_WORDS.has(this.cleanWord(w))).length;
    const normalizedPositive = totalWords > 0 ? positiveScore / totalWords : 0;
    const normalizedNegative = totalWords > 0 ? negativeScore / totalWords : 0;
    const finalScore = normalizedPositive - normalizedNegative;

    // Normalize to -1 to 1 range
    const sentimentScore = Math.max(-1, Math.min(1, finalScore));

    // Determine sentiment type
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (sentimentScore > 0.1) {
      sentiment = 'positive';
    } else if (sentimentScore < -0.1) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    // Normalize emotion scores to 0-1 range
    const maxEmotionScore = Math.max(...Object.values(emotionScores));
    const normalizedEmotions: Record<string, number> = {};
    if (maxEmotionScore > 0) {
      for (const [emotion, score] of Object.entries(emotionScores)) {
        normalizedEmotions[emotion] = Math.min(1, score / maxEmotionScore);
      }
    }

    return {
      sentiment,
      score: Math.round(sentimentScore * 100) / 100,
      keyPhrases: keyPhrases.slice(0, 5),
      emotions: normalizedEmotions,
    };
  }

  /**
   * Analyze root causes from multiple feedback texts
   */
  async analyzeRootCauses(feedbackTexts: string[]): Promise<RootCauseResult> {
    if (feedbackTexts.length === 0) {
      return { rootCauses: [] };
    }

    // Extract keywords and count frequencies
    const keywordFrequency: Record<string, number> = {};
    const categoryKeywords: Record<string, string[]> = {
      product: ['product', 'item', 'quality', 'defective', 'broken', 'damaged', 'missing', 'wrong', 'faulty', 'malfunction', 'defect', 'flaw', 'imperfection'],
      service: ['service', 'staff', 'employee', 'representative', 'personnel', 'team', 'worker', 'associate', 'agent'],
      support: ['support', 'help', 'customer service', 'assistance', 'response', 'reply', 'answer', 'resolve', 'resolution', 'ticket', 'query'],
      pricing: ['price', 'cost', 'expensive', 'cheap', 'affordable', 'value', 'money', 'payment', 'fee', 'charge', 'billing', 'invoice', 'pricing', 'overpriced'],
      delivery: ['delivery', 'shipping', 'arrived', 'late', 'fast', 'slow', 'package', 'order', 'shipment', 'dispatch', 'logistics', 'transport', 'transit'],
      website: ['website', 'site', 'web', 'online', 'page', 'browser', 'internet', 'url', 'link', 'navigation', 'interface', 'ui', 'ux'],
      app: ['app', 'application', 'mobile', 'ios', 'android', 'download', 'install', 'update', 'version', 'crash', 'freeze', 'bug'],
      communication: ['email', 'phone', 'call', 'message', 'contact', 'reach', 'respond', 'reply', 'notification', 'alert'],
      other: [],
    };

    // Analyze each feedback with n-gram support (bigrams)
    for (const text of feedbackTexts) {
      const words = this.tokenize(text.toLowerCase());
      
      // Single word analysis
      for (const word of words) {
        const cleanWord = this.cleanWord(word);
        if (STOP_WORDS.has(cleanWord) || cleanWord.length < 3) {
          continue;
        }
        keywordFrequency[cleanWord] = (keywordFrequency[cleanWord] || 0) + 1;
      }
      
      // Bigram analysis for phrases
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${this.cleanWord(words[i])} ${this.cleanWord(words[i + 1])}`;
        if (bigram.length > 5 && !STOP_WORDS.has(this.cleanWord(words[i])) && !STOP_WORDS.has(this.cleanWord(words[i + 1]))) {
          keywordFrequency[bigram] = (keywordFrequency[bigram] || 0) + 1.5; // Bigrams get higher weight
        }
      }
    }

    // Get top keywords
    const sortedKeywords = Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    // Group into root causes
    const rootCauses: Array<{
      title: string;
      description: string;
      category: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      frequency: number;
    }> = [];

    // Categorize keywords
    for (const [keyword, frequency] of sortedKeywords) {
      let category = 'other';
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
          category = cat;
          break;
        }
      }

      // Determine priority based on frequency
      let priority: 'low' | 'medium' | 'high' | 'critical';
      if (frequency >= 10) {
        priority = 'critical';
      } else if (frequency >= 5) {
        priority = 'high';
      } else if (frequency >= 3) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Check if similar root cause already exists (improved similarity matching)
      const existingCause = rootCauses.find(rc => {
        const rcTitleLower = rc.title.toLowerCase();
        const keywordLower = keyword.toLowerCase();
        
        // Exact match
        if (rcTitleLower === keywordLower) return true;
        
        // One contains the other
        if (rcTitleLower.includes(keywordLower) || keywordLower.includes(rcTitleLower)) return true;
        
        // Same category and similar words (fuzzy matching)
        if (rc.category === category) {
          const rcWords = rcTitleLower.split(/\s+/);
          const keywordWords = keywordLower.split(/\s+/);
          const commonWords = rcWords.filter(w => keywordWords.includes(w));
          if (commonWords.length > 0 && commonWords.length >= Math.min(rcWords.length, keywordWords.length) * 0.5) {
            return true;
          }
        }
        
        return false;
      });

      if (existingCause) {
        existingCause.frequency += frequency;
        // Update title if new keyword is more descriptive (longer or contains more words)
        if (keyword.split(/\s+/).length > existingCause.title.split(/\s+/).length || 
            keyword.length > existingCause.title.length) {
          existingCause.title = this.capitalizeFirst(keyword);
        }
        // Update priority if frequency increased significantly
        if (existingCause.frequency >= 10 && existingCause.priority !== 'critical') {
          existingCause.priority = 'critical';
        } else if (existingCause.frequency >= 5 && existingCause.priority === 'low') {
          existingCause.priority = 'high';
        }
      } else {
        rootCauses.push({
          title: this.capitalizeFirst(keyword),
          description: `Issue related to ${keyword} mentioned ${Math.round(frequency)} time(s) in feedback`,
          category,
          priority,
          frequency,
        });
      }
    }

    // Sort by priority and frequency
    rootCauses.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.frequency - a.frequency;
    });

    return {
      rootCauses: rootCauses.slice(0, 10).map(rc => ({
        title: rc.title,
        description: rc.description,
        category: rc.category,
        priority: rc.priority,
      })),
    };
  }

  /**
   * Generate recommendations based on root causes and patterns
   */
  async generateRecommendations(context: string): Promise<RecommendationResult> {
    const recommendations: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
    }> = [];

    const contextLower = context.toLowerCase();

    // Rule-based recommendation generation
    if (contextLower.includes('product') || contextLower.includes('quality') || contextLower.includes('defective')) {
      recommendations.push({
        title: 'Improve Product Quality Control',
        description: 'Implement stricter quality control measures and pre-shipment inspections to reduce defective products',
        priority: 'high',
        category: 'product',
        impact: 'high',
        effort: 'medium',
      });
    }

    if (contextLower.includes('service') || contextLower.includes('staff') || contextLower.includes('employee')) {
      recommendations.push({
        title: 'Enhance Customer Service Training',
        description: 'Provide comprehensive training to customer service staff on communication and problem-solving',
        priority: 'high',
        category: 'service',
        impact: 'high',
        effort: 'medium',
      });
    }

    if (contextLower.includes('support') || contextLower.includes('response') || contextLower.includes('reply')) {
      recommendations.push({
        title: 'Reduce Support Response Time',
        description: 'Implement faster response mechanisms and consider 24/7 support availability',
        priority: 'high',
        category: 'support',
        impact: 'high',
        effort: 'high',
      });
    }

    if (contextLower.includes('price') || contextLower.includes('expensive') || contextLower.includes('cost')) {
      recommendations.push({
        title: 'Review Pricing Strategy',
        description: 'Analyze pricing competitiveness and consider value-based pricing adjustments',
        priority: 'medium',
        category: 'pricing',
        impact: 'medium',
        effort: 'high',
      });
    }

    if (contextLower.includes('delivery') || contextLower.includes('shipping') || contextLower.includes('late')) {
      recommendations.push({
        title: 'Optimize Delivery Process',
        description: 'Improve logistics and delivery tracking to ensure timely and accurate deliveries',
        priority: 'high',
        category: 'delivery',
        impact: 'high',
        effort: 'medium',
      });
    }

    if (contextLower.includes('negative') || contextLower.includes('complaint') || contextLower.includes('issue')) {
      recommendations.push({
        title: 'Implement Proactive Issue Resolution',
        description: 'Create a systematic approach to identify and resolve issues before they escalate',
        priority: 'high',
        category: 'process',
        impact: 'high',
        effort: 'medium',
      });
    }

    // Default recommendations if none match
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Enhance Overall Customer Experience',
        description: 'Conduct comprehensive review of customer touchpoints and implement improvements',
        priority: 'medium',
        category: 'process',
        impact: 'medium',
        effort: 'high',
      });
    }

    return { recommendations };
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Clean word (remove punctuation, lowercase)
   */
  private cleanWord(word: string): string {
    return word.toLowerCase().replace(/[^\w]/g, '');
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
