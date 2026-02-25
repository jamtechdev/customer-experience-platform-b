export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CSVImport {
  id: number;
  filename: string;
  originalFilename: string;
  filePath: string;
  rowCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CSVMapping {
  id: number;
  name: string;
  csvImportId: number;
  mappings: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerFeedback {
  id: number;
  source: string;
  content: string;
  author?: string;
  rating?: number;
  date: Date;
  companyId: number;
  competitorId?: number;
  touchpointId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SentimentAnalysis {
  id: number;
  feedbackId: number;
  sentiment: string;
  score: number;
  keyPhrases: string[];
  emotions?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NPSSurvey {
  id: number;
  score: number;
  comment?: string;
  customerId?: string;
  companyId: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RootCause {
  id: number;
  title: string;
  description: string;
  category: string;
  feedbackIds: number[];
  touchpointId?: number;
  priority: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AIRecommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  category: string;
  rootCauseId?: number;
  impact: string;
  effort: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  priority: string;
  type: string;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Touchpoint {
  id: number;
  name: string;
  description: string;
  category: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JourneyStage {
  id: number;
  name: string;
  description: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JourneyAnalysis {
  id: number;
  stageId: number;
  satisfactionScore: number;
  feedbackCount: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Competitor {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}
