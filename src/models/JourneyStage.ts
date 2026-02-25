import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface JourneyStageAttributes {
  id: number;
  name: string;
  description: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JourneyStageCreationAttributes extends Optional<JourneyStageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JourneyStage extends Model<JourneyStageAttributes, JourneyStageCreationAttributes> implements JourneyStageAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

JourneyStage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'journey_stages',
    timestamps: true,
  }
);

export default JourneyStage;
