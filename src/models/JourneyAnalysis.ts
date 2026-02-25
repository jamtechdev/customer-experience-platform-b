import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import JourneyStage from './JourneyStage';

interface JourneyAnalysisAttributes {
  id: number;
  stageId: number;
  satisfactionScore: number;
  feedbackCount: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JourneyAnalysisCreationAttributes extends Optional<JourneyAnalysisAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JourneyAnalysis extends Model<JourneyAnalysisAttributes, JourneyAnalysisCreationAttributes> implements JourneyAnalysisAttributes {
  public id!: number;
  public stageId!: number;
  public satisfactionScore!: number;
  public feedbackCount!: number;
  public date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JourneyAnalysis.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: JourneyStage,
        key: 'id',
      },
    },
    satisfactionScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    feedbackCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'journey_analysis',
    timestamps: true,
  }
);

JourneyAnalysis.belongsTo(JourneyStage, { foreignKey: 'stageId' });

export default JourneyAnalysis;
