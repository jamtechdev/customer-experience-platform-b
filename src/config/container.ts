import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import { AuthService } from '../services/AuthService';
import { CSVService } from '../services/CSVService';
import { SentimentAnalysisService } from '../services/SentimentAnalysisService';
import { NPSService } from '../services/NPSService';
import { RootCauseService } from '../services/RootCauseService';
import { CompetitorAnalysisService } from '../services/CompetitorAnalysisService';
import { AlertService } from '../services/AlertService';
import { JourneyAnalysisService } from '../services/JourneyAnalysisService';
import { TouchpointService } from '../services/TouchpointService';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { OfflineAnalysisService } from '../services/OfflineAnalysisService';
import { SocialMediaAnalysisService } from '../services/SocialMediaAnalysisService';
import { ProcessEnhancementService } from '../services/ProcessEnhancementService';
import { ReportService } from '../services/ReportService';
import { SettingsService } from '../services/SettingsService';

const container = new Container();

// Register services
container.bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<CSVService>(TYPES.CSVService).to(CSVService).inSingletonScope();
container.bind<OfflineAnalysisService>(TYPES.OfflineAnalysisService).to(OfflineAnalysisService).inSingletonScope();
container.bind<SentimentAnalysisService>(TYPES.SentimentAnalysisService).to(SentimentAnalysisService).inSingletonScope();
container.bind<NPSService>(TYPES.NPSService).to(NPSService).inSingletonScope();
container.bind<RootCauseService>(TYPES.RootCauseService).to(RootCauseService).inSingletonScope();
container.bind<CompetitorAnalysisService>(TYPES.CompetitorAnalysisService).to(CompetitorAnalysisService).inSingletonScope();
container.bind<AlertService>(TYPES.AlertService).to(AlertService).inSingletonScope();
container.bind<JourneyAnalysisService>(TYPES.JourneyAnalysisService).to(JourneyAnalysisService).inSingletonScope();
container.bind<TouchpointService>(TYPES.TouchpointService).to(TouchpointService).inSingletonScope();
container.bind<AIRecommendationService>(TYPES.AIRecommendationService).to(AIRecommendationService).inSingletonScope();
container.bind<SocialMediaAnalysisService>(TYPES.SocialMediaAnalysisService).to(SocialMediaAnalysisService).inSingletonScope();
container.bind<ProcessEnhancementService>(TYPES.ProcessEnhancementService).to(ProcessEnhancementService).inSingletonScope();
container.bind<ReportService>(TYPES.ReportService).to(ReportService).inSingletonScope();
container.bind<SettingsService>(TYPES.SettingsService).to(SettingsService).inSingletonScope();

export default container;
