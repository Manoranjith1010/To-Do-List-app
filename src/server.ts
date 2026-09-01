import { createApp } from './app';
import { env } from './lib/env';
import { prisma } from './lib/prisma';

async function main(): Promise<void> {
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Todo API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});
