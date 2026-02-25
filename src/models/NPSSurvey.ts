import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company';

interface NPSSurveyAttributes {
  id: number;
  score: number;
  comment?: string;
  customerId?: string;
  companyId: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NPSSurveyCreationAttributes extends Optional<NPSSurveyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class NPSSurvey extends Model<NPSSurveyAttributes, NPSSurveyCreationAttributes> implements NPSSurveyAttributes {
  public id!: number;
  public score!: number;
  public comment?: string;
  public customerId?: string;
  public companyId!: number;
  public date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NPSSurvey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'nps_surveys',
    timestamps: true,
  }
);

NPSSurvey.belongsTo(Company, { foreignKey: 'companyId' });

export default NPSSurvey;
