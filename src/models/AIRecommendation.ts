import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import RootCause from './RootCause';
import { AlertPriority } from '../config/constants';

interface AIRecommendationAttributes {
  id: number;
  title: string;
  description: string;
  priority: AlertPriority;
  category: string;
  rootCauseId?: number;
  impact: string;
  effort: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AIRecommendationCreationAttributes extends Optional<AIRecommendationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class AIRecommendation extends Model<AIRecommendationAttributes, AIRecommendationCreationAttributes> implements AIRecommendationAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public priority!: AlertPriority;
  public category!: string;
  public rootCauseId?: number;
  public impact!: string;
  public effort!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AIRecommendation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(AlertPriority)),
      allowNull: false,
      defaultValue: AlertPriority.MEDIUM,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rootCauseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: RootCause,
        key: 'id',
      },
    },
    impact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    effort: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ai_recommendations',
    timestamps: true,
  }
);

AIRecommendation.belongsTo(RootCause, { foreignKey: 'rootCauseId' });

export default AIRecommendation;
