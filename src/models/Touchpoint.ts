import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TouchpointAttributes {
  id: number;
  name: string;
  description: string;
  category: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TouchpointCreationAttributes extends Optional<TouchpointAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Touchpoint extends Model<TouchpointAttributes, TouchpointCreationAttributes> implements TouchpointAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public category!: string;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Touchpoint.init(
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
    category: {
      type: DataTypes.STRING,
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
    tableName: 'touchpoints',
    timestamps: true,
  }
);

export default Touchpoint;
