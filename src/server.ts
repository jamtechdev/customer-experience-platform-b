import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import sequelize from './config/database';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import './models'; // Initialize models

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Database sync disabled - use migrations instead
    // Migrations should be run manually: npm run migrate
    // This prevents issues with existing data and invalid dates

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
