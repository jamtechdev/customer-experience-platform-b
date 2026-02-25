import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import { AlertPriority } from '../config/constants';

interface AlertAttributes {
  id: number;
  title: string;
  message: string;
  priority: AlertPriority;
  type: string;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'createdAt' | 'updatedAt' | 'acknowledged'> {}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public title!: string;
  public message!: string;
  public priority!: AlertPriority;
  public type!: string;
  public acknowledged!: boolean;
  public acknowledgedBy?: number;
  public acknowledgedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Alert.init(
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(AlertPriority)),
      allowNull: false,
      defaultValue: AlertPriority.MEDIUM,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    acknowledged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    acknowledgedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
  }
);

Alert.belongsTo(User, { foreignKey: 'acknowledgedBy', as: 'acknowledger' });

export default Alert;
