import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { envs } from './config/envs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  if (envs.corsOrigin) {
    app.enableCors({ origin: envs.corsOrigin.split(',').map((origin) => origin.trim()), methods: ['GET', 'POST'] });
  }
  await app.listen(envs.port);
}

void bootstrap();
