import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import CustomerFeedback from './CustomerFeedback';
import { SentimentType } from '../config/constants';

interface SentimentAnalysisAttributes {
  id: number;
  feedbackId: number;
  sentiment: SentimentType;
  score: number;
  keyPhrases: string[];
  emotions?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SentimentAnalysisCreationAttributes extends Optional<SentimentAnalysisAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SentimentAnalysis extends Model<SentimentAnalysisAttributes, SentimentAnalysisCreationAttributes> implements SentimentAnalysisAttributes {
  public id!: number;
  public feedbackId!: number;
  public sentiment!: SentimentType;
  public score!: number;
  public keyPhrases!: string[];
  public emotions?: Record<string, number>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SentimentAnalysis.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feedbackId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'feedback_id',
      references: {
        model: CustomerFeedback,
        key: 'id',
      },
    },
    sentiment: {
      type: DataTypes.ENUM(...Object.values(SentimentType)),
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -1,
        max: 1,
      },
    },
    keyPhrases: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'key_phrases',
    },
    emotions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sentiment_analysis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

SentimentAnalysis.belongsTo(CustomerFeedback, { foreignKey: 'feedbackId', targetKey: 'id' });

export default SentimentAnalysis;
