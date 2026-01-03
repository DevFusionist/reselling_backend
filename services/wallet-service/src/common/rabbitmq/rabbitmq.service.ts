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
  private readonly queue = 'wallet.queue';
  private readonly dlq = 'wallet.dlq';

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

        // Assert DLQ
        await channel.assertQueue(this.dlq, {
          durable: true,
        });

        // Assert main queue with DLX
        await channel.assertQueue(this.queue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': this.dlq,
          },
        });

        // Bind queue to exchange for events we consume
        await channel.bindQueue(this.queue, this.exchange, 'payment.success');
        await channel.bindQueue(this.queue, this.exchange, 'order.delivered');
        await channel.bindQueue(this.queue, this.exchange, 'order.cancelled');

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
            this.channelWrapper.nack(msg, false, false); // Send to DLQ
          }
        }
      },
      { noAck: false },
    );
  }

  async publishEvent(routingKey: string, event: any): Promise<boolean> {
    try {
      const eventPayload = {
        event: this.getEventNameFromRoutingKey(routingKey),
        timestamp: new Date().toISOString(),
        data: event,
      };

      const result = await this.channelWrapper.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(eventPayload)),
        {
          persistent: true,
        },
      );

      if (result) {
        this.logger.log(`Published event: ${routingKey}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error publishing event ${routingKey}:`, error);
      return false;
    }
  }

  /**
   * OPTIMIZATION: Batch publish multiple events for better performance
   * @param events Array of { routingKey, data } objects
   * @returns Array of boolean results for each event
   */
  async publishBatch(events: Array<{ routingKey: string; data: any }>): Promise<boolean[]> {
    const results: boolean[] = [];
    const timestamp = new Date().toISOString();

    try {
      // Publish all events in parallel
      const publishPromises = events.map(async ({ routingKey, data }) => {
        try {
          const eventPayload = {
            event: this.getEventNameFromRoutingKey(routingKey),
            timestamp,
            data,
          };

          const result = await this.channelWrapper.publish(
            this.exchange,
            routingKey,
            Buffer.from(JSON.stringify(eventPayload)),
            {
              persistent: true,
            },
          );

          if (result) {
            this.logger.debug(`Published event in batch: ${routingKey}`);
          }

          return result;
        } catch (error) {
          this.logger.error(`Error publishing event ${routingKey} in batch:`, error);
          return false;
        }
      });

      const batchResults = await Promise.all(publishPromises);
      results.push(...batchResults);

      this.logger.log(`Published batch of ${events.length} events: ${results.filter(r => r).length} succeeded`);
      return results;
    } catch (error) {
      this.logger.error('Error publishing batch events:', error);
      return events.map(() => false);
    }
  }

  private getEventNameFromRoutingKey(routingKey: string): string {
    return routingKey
      .split('.')
      .map((part) => part.toUpperCase())
      .join('_');
  }
}

