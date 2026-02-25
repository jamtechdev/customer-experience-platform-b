import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompanyAttributes {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public industry?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Company.init(
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
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'companies',
    timestamps: true,
  }
);

export default Company;
