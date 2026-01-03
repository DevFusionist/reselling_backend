import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RabbitMQModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

