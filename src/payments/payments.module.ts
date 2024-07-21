import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { env, NATS_SERVER } from '../config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVER,
        transport: Transport.NATS,
        options: {
          servers: env.natsServer,
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
