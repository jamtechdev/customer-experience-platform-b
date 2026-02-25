import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PasswordResetAttributes {
  id: number;
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PasswordResetCreationAttributes extends Optional<PasswordResetAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PasswordReset extends Model<PasswordResetAttributes, PasswordResetCreationAttributes> implements PasswordResetAttributes {
  public id!: number;
  public email!: string;
  public otp!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'password_resets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false,
  }
);

export default PasswordReset;
