require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'customer_experience',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    dialectOptions: {
      charset: 'utf8mb4'
    }
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME + '_test' || 'customer_experience_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    dialectOptions: {
      charset: 'utf8mb4'
    }
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'customer_experience',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    dialectOptions: {
      charset: 'utf8mb4'
    }
  }
};
