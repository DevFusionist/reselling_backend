import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { NotificationType, NotificationStatus } from '../../generated/prisma';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private rabbitMQService: RabbitMQService,
    private configService: ConfigService,
  ) {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async onModuleInit() {
    // Start consuming events
    await this.rabbitMQService.consumeEvents(async (message, routingKey) => {
      await this.handleEvent(message, routingKey);
    });
  }

  private async handleEvent(message: any, routingKey: string) {
    this.logger.log(`Received event: ${routingKey}`);

    const eventType = message.event || routingKey.replace('.', '_').toUpperCase();
    const data = message.data || message;

    switch (routingKey) {
      case 'order.created':
        await this.handleOrderCreated(data);
        break;
      case 'order.paid':
        await this.handleOrderPaid(data);
        break;
      case 'order.delivered':
        await this.handleOrderDelivered(data);
        break;
      case 'payment.success':
        await this.handlePaymentSuccess(data);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(data);
        break;
      case 'wallet.commission.unlocked':
        await this.handleCommissionUnlocked(data);
        break;
    }
  }

  private async handleOrderCreated(data: any) {
    await this.sendNotification({
      userId: data.userId,
      type: NotificationType.EMAIL,
      subject: 'Order Confirmed',
      message: `Your order ${data.orderNumber} has been created successfully.`,
      recipient: data.userEmail || `${data.userId}@example.com`,
      eventType: 'ORDER_CREATED',
      metadata: JSON.stringify(data),
    });
  }

  private async handleOrderPaid(data: any) {
    await this.sendNotification({
      userId: data.userId,
      type: NotificationType.EMAIL,
      subject: 'Payment Received',
      message: `Payment for order ${data.orderNumber} has been received.`,
      recipient: data.userEmail || `${data.userId}@example.com`,
      eventType: 'ORDER_PAID',
      metadata: JSON.stringify(data),
    });
  }

  private async handleOrderDelivered(data: any) {
    await this.sendNotification({
      userId: data.userId,
      type: NotificationType.EMAIL,
      subject: 'Order Delivered',
      message: `Your order ${data.orderNumber} has been delivered.`,
      recipient: data.userEmail || `${data.userId}@example.com`,
      eventType: 'ORDER_DELIVERED',
      metadata: JSON.stringify(data),
    });
  }

  private async handlePaymentSuccess(data: any) {
    await this.sendNotification({
      userId: data.userId,
      type: NotificationType.EMAIL,
      subject: 'Payment Successful',
      message: `Your payment of $${data.amount} has been processed successfully.`,
      recipient: data.userEmail || `${data.userId}@example.com`,
      eventType: 'PAYMENT_SUCCESS',
      metadata: JSON.stringify(data),
    });
  }

  private async handlePaymentFailed(data: any) {
    await this.sendNotification({
      userId: data.userId,
      type: NotificationType.EMAIL,
      subject: 'Payment Failed',
      message: `Your payment failed. Reason: ${data.failureReason || 'Unknown'}`,
      recipient: data.userEmail || `${data.userId}@example.com`,
      eventType: 'PAYMENT_FAILED',
      metadata: JSON.stringify(data),
    });
  }

  private async handleCommissionUnlocked(data: any) {
    await this.sendNotification({
      userId: data.sellerId,
      type: NotificationType.EMAIL,
      subject: 'Commission Unlocked',
      message: `Commission of $${data.commission} has been unlocked and added to your wallet.`,
      recipient: data.sellerEmail || `${data.sellerId}@example.com`,
      eventType: 'COMMISSION_UNLOCKED',
      metadata: JSON.stringify(data),
    });
  }

  private async sendNotification(notification: {
    userId: string;
    type: NotificationType;
    subject?: string;
    message: string;
    recipient: string;
    eventType?: string;
    metadata?: string;
  }) {
    try {
      // Create notification record
      const record = await this.prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          status: NotificationStatus.PENDING,
          subject: notification.subject,
          message: notification.message,
          recipient: notification.recipient,
          eventType: notification.eventType,
          metadata: notification.metadata,
        },
      });

      // Send based on type
      let sent = false;
      if (notification.type === NotificationType.EMAIL) {
        sent = await this.sendEmail(notification.recipient, notification.subject || '', notification.message);
      } else if (notification.type === NotificationType.SMS) {
        sent = await this.sendSMS(notification.recipient, notification.message);
      } else if (notification.type === NotificationType.WHATSAPP) {
        sent = await this.sendWhatsApp(notification.recipient, notification.message);
      }

      // Update status
      await this.prisma.notification.update({
        where: { id: record.id },
        data: {
          status: sent ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: sent ? new Date() : null,
          error: sent ? null : 'Failed to send notification',
        },
      });

      this.logger.log(`Notification ${record.id} ${sent ? 'sent' : 'failed'}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  private async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    try {
      await this.emailTransporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
        to,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      });
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  private async sendSMS(phone: string, message: string): Promise<boolean> {
    // Implement SMS sending logic (e.g., Twilio, AWS SNS)
    this.logger.log(`SMS to ${phone}: ${message}`);
    return true;
  }

  private async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    // Implement WhatsApp sending logic (e.g., Twilio WhatsApp API)
    this.logger.log(`WhatsApp to ${phone}: ${message}`);
    return true;
  }

  async getNotifications(userId: string, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    // OPTIMIZATION: Use select to fetch only required fields
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limitedTake,
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          subject: true,
          message: true,
          recipient: true,
          eventType: true,
          sentAt: true,
          error: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return { data, total, skip, take: limitedTake };
  }
}

