import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { env } from './config';

async function bootstrap() {
  const logger = new Logger('Payments-ms');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: env.natsServer,
        name: 'Payments-ms',
      },
    },
    {
      inheritAppConfig: true,
    },
  );
  await app.startAllMicroservices();

  await app.listen(env.port);
  logger.log(`Microservicio corriendo en port ${env.port}`);
}
bootstrap();
