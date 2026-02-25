import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import CSVImport from './CSVImport';

interface CSVMappingAttributes {
  id: number;
  name: string;
  csvImportId: number;
  mappings: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CSVMappingCreationAttributes extends Optional<CSVMappingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CSVMapping extends Model<CSVMappingAttributes, CSVMappingCreationAttributes> implements CSVMappingAttributes {
  public id!: number;
  public name!: string;
  public csvImportId!: number;
  public mappings!: Record<string, string>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CSVMapping.init(
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
    csvImportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CSVImport,
        key: 'id',
      },
    },
    mappings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'csv_mappings',
    timestamps: true,
  }
);

CSVMapping.belongsTo(CSVImport, { foreignKey: 'csvImportId' });

export default CSVMapping;
