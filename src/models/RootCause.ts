import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Touchpoint from './Touchpoint';
import { AlertPriority } from '../config/constants';

interface RootCauseAttributes {
  id: number;
  title: string;
  description: string;
  category: string;
  feedbackIds: number[];
  touchpointId?: number;
  priority: AlertPriority;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RootCauseCreationAttributes extends Optional<RootCauseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class RootCause extends Model<RootCauseAttributes, RootCauseCreationAttributes> implements RootCauseAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public category!: string;
  public feedbackIds!: number[];
  public touchpointId?: number;
  public priority!: AlertPriority;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RootCause.init(
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
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    feedbackIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'feedback_ids',
    },
    touchpointId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'touchpoint_id',
      references: {
        model: Touchpoint,
        key: 'id',
      },
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(AlertPriority)),
      allowNull: false,
      defaultValue: AlertPriority.MEDIUM,
    },
  },
  {
    sequelize,
    tableName: 'root_causes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

RootCause.belongsTo(Touchpoint, { foreignKey: 'touchpointId', targetKey: 'id' });

export default RootCause;
