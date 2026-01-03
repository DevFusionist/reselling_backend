import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as amqpConnectionManager from 'amqp-connection-manager';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqpConnectionManager.AmqpConnectionManager;
  private channelWrapper: amqpConnectionManager.ChannelWrapper;
  private readonly exchange = 'events.exchange';
  private readonly queue = 'notification.queue';
  private readonly dlq = 'notification.dlq';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672';

    this.connection = amqpConnectionManager.connect([url], {
      reconnectTimeInSeconds: 5,
    });

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: amqp.Channel) => {
        await channel.assertExchange(this.exchange, 'topic', {
          durable: true,
        });

        await channel.assertQueue(this.dlq, {
          durable: true,
        });

        await channel.assertQueue(this.queue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': this.dlq,
          },
        });

        // Bind to events we consume
        await channel.bindQueue(this.queue, this.exchange, 'order.created');
        await channel.bindQueue(this.queue, this.exchange, 'order.paid');
        await channel.bindQueue(this.queue, this.exchange, 'order.delivered');
        await channel.bindQueue(this.queue, this.exchange, 'payment.success');
        await channel.bindQueue(this.queue, this.exchange, 'payment.failed');
        await channel.bindQueue(this.queue, this.exchange, 'wallet.commission.unlocked');

        this.logger.log(`Queue '${this.queue}' set up and bound to exchange`);
      },
    });

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.warn('Disconnected from RabbitMQ', err);
    });
  }

  async onModuleDestroy() {
    if (this.channelWrapper) {
      await this.channelWrapper.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async consumeEvents(callback: (message: any, routingKey: string) => Promise<void>) {
    this.channelWrapper.consume(
      this.queue,
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;
            await callback(content, routingKey);
            this.channelWrapper.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message:', error);
            this.channelWrapper.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
  }
}

