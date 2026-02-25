import User from './User';
import Company from './Company';
import Competitor from './Competitor';
import CSVImport from './CSVImport';
import CSVMapping from './CSVMapping';
import CustomerFeedback from './CustomerFeedback';
import Touchpoint from './Touchpoint';
import SentimentAnalysis from './SentimentAnalysis';
import NPSSurvey from './NPSSurvey';
import RootCause from './RootCause';
import AIRecommendation from './AIRecommendation';
import Alert from './Alert';
import JourneyStage from './JourneyStage';
import JourneyAnalysis from './JourneyAnalysis';

// Define associations
Company.hasMany(Competitor, { foreignKey: 'companyId' });
Company.hasMany(CustomerFeedback, { foreignKey: 'companyId' });
Company.hasMany(NPSSurvey, { foreignKey: 'companyId' });

User.hasMany(CSVImport, { foreignKey: 'userId' });

CSVImport.hasMany(CSVMapping, { foreignKey: 'csvImportId' });

Touchpoint.hasMany(CustomerFeedback, { foreignKey: 'touchpointId' });
Touchpoint.hasMany(RootCause, { foreignKey: 'touchpointId' });

CustomerFeedback.hasOne(SentimentAnalysis, { foreignKey: 'feedbackId' });

RootCause.hasMany(AIRecommendation, { foreignKey: 'rootCauseId' });

JourneyStage.hasMany(JourneyAnalysis, { foreignKey: 'stageId' });

export {
  User,
  Company,
  Competitor,
  CSVImport,
  CSVMapping,
  CustomerFeedback,
  Touchpoint,
  SentimentAnalysis,
  NPSSurvey,
  RootCause,
  AIRecommendation,
  Alert,
  JourneyStage,
  JourneyAnalysis,
};
