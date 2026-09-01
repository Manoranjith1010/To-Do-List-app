import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import { env } from './lib/env';

export function createApp(): Application {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : false,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
