import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company';

interface CompetitorAttributes {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompetitorCreationAttributes extends Optional<CompetitorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Competitor extends Model<CompetitorAttributes, CompetitorCreationAttributes> implements CompetitorAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public companyId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Competitor.init(
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
  },
  {
    sequelize,
    tableName: 'competitors',
    timestamps: true,
  }
);

Competitor.belongsTo(Company, { foreignKey: 'companyId' });

export default Competitor;
