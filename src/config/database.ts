import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const dbDialect = process.env.DB_DIALECT || 'mysql';
const dbStorage = process.env.DB_STORAGE || './database.sqlite';

let sequelize: Sequelize;

if (dbDialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbStorage,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else if (dbDialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'customer_experience',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      dialectModule: require('mysql2'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'customer_experience',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: dbDialect as any,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

export default sequelize;
