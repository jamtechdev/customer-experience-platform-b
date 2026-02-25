import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface CSVImportAttributes {
  id: number;
  filename: string;
  originalFilename: string;
  filePath: string;
  rowCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: number;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CSVImportCreationAttributes extends Optional<CSVImportAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CSVImport extends Model<CSVImportAttributes, CSVImportCreationAttributes> implements CSVImportAttributes {
  public id!: number;
  public filename!: string;
  public originalFilename!: string;
  public filePath!: string;
  public rowCount!: number;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public userId!: number;
  public errorMessage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CSVImport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalFilename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rowCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'csv_imports',
    timestamps: true,
  }
);

CSVImport.belongsTo(User, { foreignKey: 'userId' });

export default CSVImport;
