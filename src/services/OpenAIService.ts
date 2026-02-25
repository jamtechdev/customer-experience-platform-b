import { injectable } from 'inversify';
import openai from '../config/openai';
import { AppError } from '../middleware/errorHandler';

@injectable()
export class OpenAIService {
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    keyPhrases: string[];
    emotions?: Record<string, number>;
  }> {
    try {
      const prompt = `Analyze the sentiment of the following customer feedback. Provide:
1. Sentiment classification: positive, negative, or neutral
2. Sentiment score: a number between -1 (very negative) and 1 (very positive)
3. Key phrases: up to 5 important phrases that indicate the sentiment
4. Emotions: a JSON object with emotion scores (0-1) for: joy, sadness, anger, fear, surprise, disgust

Customer feedback: "${text}"

Respond in JSON format:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.0,
  "keyPhrases": ["phrase1", "phrase2"],
  "emotions": {
    "joy": 0.0,
    "sadness": 0.0,
    "anger": 0.0,
    "fear": 0.0,
    "surprise": 0.0,
    "disgust": 0.0
  }
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('Failed to get response from OpenAI', 500);
      }

      const result = JSON.parse(content);
      return {
        sentiment: result.sentiment,
        score: result.score,
        keyPhrases: result.keyPhrases || [],
        emotions: result.emotions,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`OpenAI API error: ${error.message}`, 500);
    }
  }

  async analyzeRootCauses(feedbackTexts: string[]): Promise<{
    rootCauses: Array<{
      title: string;
      description: string;
      category: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    try {
      const feedbackSummary = feedbackTexts.slice(0, 20).join('\n---\n');

      const prompt = `Analyze the following customer feedback and identify root causes of complaints. For each root cause, provide:
1. Title: A short descriptive title
2. Description: A detailed explanation
3. Category: One of: product, service, support, pricing, delivery, other
4. Priority: low, medium, high, or critical based on frequency and impact

Customer feedback:
${feedbackSummary}

Respond in JSON format:
{
  "rootCauses": [
    {
      "title": "Root cause title",
      "description": "Detailed description",
      "category": "product|service|support|pricing|delivery|other",
      "priority": "low|medium|high|critical"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a customer experience analyst. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('Failed to get response from OpenAI', 500);
      }

      const result = JSON.parse(content);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`OpenAI API error: ${error.message}`, 500);
    }
  }

  async generateRecommendations(context: string): Promise<{
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const prompt = `Based on the following customer experience analysis, provide actionable recommendations to improve customer satisfaction. For each recommendation, provide:
1. Title: A short descriptive title
2. Description: Detailed explanation of the recommendation
3. Priority: low, medium, high, or critical
4. Category: One of: product, service, support, pricing, delivery, process, other
5. Impact: Expected impact level (low, medium, high)
6. Effort: Required effort to implement (low, medium, high)

Analysis context:
${context}

Respond in JSON format:
{
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "low|medium|high|critical",
      "category": "product|service|support|pricing|delivery|process|other",
      "impact": "low|medium|high",
      "effort": "low|medium|high"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a customer experience consultant. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('Failed to get response from OpenAI', 500);
      }

      const result = JSON.parse(content);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`OpenAI API error: ${error.message}`, 500);
    }
  }
}
