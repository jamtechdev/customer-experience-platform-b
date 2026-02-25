import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company';
import Competitor from './Competitor';
import Touchpoint from './Touchpoint';

interface CustomerFeedbackAttributes {
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

interface CustomerFeedbackCreationAttributes extends Optional<CustomerFeedbackAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerFeedback extends Model<CustomerFeedbackAttributes, CustomerFeedbackCreationAttributes> implements CustomerFeedbackAttributes {
  public id!: number;
  public source!: string;
  public content!: string;
  public author?: string;
  public rating?: number;
  public date!: Date;
  public companyId!: number;
  public competitorId?: number;
  public touchpointId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerFeedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: Company,
        key: 'id',
      },
    },
    competitorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'competitor_id',
      references: {
        model: Competitor,
        key: 'id',
      },
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
  },
  {
    sequelize,
    tableName: 'customer_feedback',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

CustomerFeedback.belongsTo(Company, { foreignKey: 'companyId' });
CustomerFeedback.belongsTo(Competitor, { foreignKey: 'competitorId' });
CustomerFeedback.belongsTo(Touchpoint, { foreignKey: 'touchpointId' });

export default CustomerFeedback;
