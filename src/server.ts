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

// Get port from environment, must be set in .env file
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

if (!PORT || isNaN(PORT)) {
  logger.error('PORT environment variable is required and must be a valid number.');
  logger.error('Please set PORT in your .env file (e.g., PORT=5000)');
  process.exit(1);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Get frontend URL from environment
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  logger.warn('FRONTEND_URL not set in .env file. Using default: http://localhost:4200');
}

app.use(cors({
  origin: FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language', 'X-Requested-With']
}));
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

    // Start server with error handling for port conflicts
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API available at http://localhost:${PORT}/api`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use.`);
        logger.error(`Please update PORT in your .env file to use a different port.`);
        logger.error(`Current PORT in .env: ${process.env.PORT}`);
        logger.error(`To find the process using port ${PORT}: netstat -ano | findstr :${PORT}`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Unable to start server:', err.message);
    logger.error('Stack:', err.stack);
    process.exit(1);
  }
};

startServer();

export default app;
