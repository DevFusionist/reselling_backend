import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../../generated/prisma';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private rabbitMQService: RabbitMQService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Initialize Razorpay
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (razorpayKeyId && razorpayKeySecret) {
      this.razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
      this.logger.log('Razorpay initialized successfully');
    } else {
      this.logger.warn('Razorpay credentials not found. Payment gateway features will be limited.');
    }
  }

  async create(createPaymentDto: CreatePaymentDto) {
    // OPTIMIZATION: Use select to check existence only
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: createPaymentDto.orderId },
      select: { id: true },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: createPaymentDto.orderId,
        userId: createPaymentDto.userId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'INR',
        status: PaymentStatus.PENDING,
        method: createPaymentDto.method,
      },
    });

    // Log payment initiation
    await this.prisma.paymentLog.create({
      data: {
        paymentId: payment.id,
        action: 'initiated',
        data: JSON.stringify({ method: createPaymentDto.method }),
      },
    });

    this.logger.log(`Payment ${payment.id} initiated for order ${createPaymentDto.orderId}`);

    return payment;
  }

  async createRazorpayOrder(createPaymentDto: CreatePaymentDto) {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay is not configured');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: createPaymentDto.orderId },
      select: { id: true, gatewayId: true },
    });

    let payment;
    let razorpayOrder;

    if (existingPayment && existingPayment.gatewayId) {
      // Payment already exists with Razorpay order ID
      payment = await this.prisma.payment.findUnique({
        where: { id: existingPayment.id },
      });
      
      try {
        // Fetch existing Razorpay order
        razorpayOrder = await this.razorpay.orders.fetch(existingPayment.gatewayId);
      } catch (error) {
        this.logger.error(`Failed to fetch Razorpay order ${existingPayment.gatewayId}:`, error);
        throw new BadRequestException('Failed to fetch existing Razorpay order');
      }
    } else {
      // Create payment record
      payment = await this.prisma.payment.create({
        data: {
          orderId: createPaymentDto.orderId,
          userId: createPaymentDto.userId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency || 'INR',
          status: PaymentStatus.PENDING,
          method: createPaymentDto.method,
        },
      });

      // Create Razorpay order
      try {
        const amountInPaise = Math.round(createPaymentDto.amount * 100); // Convert to paise
        razorpayOrder = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency: createPaymentDto.currency || 'INR',
          receipt: `order_${createPaymentDto.orderId}`,
          notes: {
            orderId: createPaymentDto.orderId,
            userId: createPaymentDto.userId,
            paymentId: payment.id,
          },
        });

        // Update payment with Razorpay order ID
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            gatewayId: razorpayOrder.id,
            gatewayResponse: JSON.stringify(razorpayOrder),
          },
        });

        // Log Razorpay order creation
        await this.prisma.paymentLog.create({
          data: {
            paymentId: payment.id,
            action: 'razorpay_order_created',
            data: JSON.stringify(razorpayOrder),
          },
        });

        this.logger.log(`Razorpay order created: ${razorpayOrder.id} for payment ${payment.id}`);
      } catch (error) {
        this.logger.error('Failed to create Razorpay order:', error);
        // Update payment status to failed
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: error.message || 'Failed to create Razorpay order',
          },
        });
        throw new BadRequestException('Failed to create Razorpay order');
      }
    }

    return {
      payment,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        key: this.configService.get<string>('RAZORPAY_KEY_ID'),
      },
    };
  }

  async findAll(userId?: string, status?: PaymentStatus, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limitedTake,
        select: {
          id: true,
          orderId: true,
          userId: true,
          amount: true,
          currency: true,
          status: true,
          method: true,
          gatewayId: true,
          failureReason: true,
          createdAt: true,
          updatedAt: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              action: true,
              data: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, skip, take: limitedTake };
  }

  async findOne(id: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        gatewayId: true,
        gatewayResponse: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Limit logs
          select: {
            id: true,
            action: true,
            data: true,
            createdAt: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByOrderId(orderId: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        gatewayId: true,
        gatewayResponse: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Limit logs
          select: {
            id: true,
            action: true,
            data: true,
            createdAt: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  async handleWebhook(payload: any, signature: string, rawBody?: string) {
    // Verify Razorpay webhook signature
    const isValid = this.verifyRazorpayWebhookSignature(rawBody || JSON.stringify(payload), signature);

    if (!isValid) {
      this.logger.warn('Invalid Razorpay webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    // Razorpay webhook payload structure
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (!paymentEntity && !orderEntity) {
      this.logger.warn('Invalid webhook payload structure');
      throw new BadRequestException('Invalid webhook payload');
    }

    // Extract order ID from Razorpay order notes or payment notes
    const orderId = orderEntity?.notes?.orderId || paymentEntity?.notes?.orderId;
    const gatewayId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;
    const status = paymentEntity?.status || orderEntity?.status;
    const failureReason = paymentEntity?.error_description || paymentEntity?.error_code;

    if (!orderId) {
      this.logger.warn('Order ID not found in webhook payload');
      throw new BadRequestException('Order ID not found in webhook payload');
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        userId: true,
        amount: true,
        status: true,
        gatewayId: true,
        failureReason: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    // Fetch order details to get sellerId and commission
    let orderDetails: any = null;
    try {
      // Use localhost as default for local development
      const orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:3004';
      const orderResponse: any = await firstValueFrom(
        this.httpService.get(`${orderServiceUrl}/orders/${orderId}`),
      );
      orderDetails = orderResponse.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch order ${orderId} details:`, error);
    }

    // Map Razorpay status to our payment status
    const paymentStatus = this.mapRazorpayStatusToPaymentStatus(status, event);

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        gatewayId: gatewayId || razorpayPaymentId,
        gatewayResponse: JSON.stringify(payload),
        failureReason: failureReason || null,
      },
    });

    // Log webhook
    await this.prisma.paymentLog.create({
      data: {
        paymentId: payment.id,
        action: 'webhook_received',
        data: JSON.stringify(payload),
      },
    });

    // Update order status if payment succeeded
    if (updatedPayment.status === PaymentStatus.SUCCESS && orderDetails) {
      try {
        // Use localhost as default for local development
      const orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:3004';
        await firstValueFrom(
          this.httpService.patch(`${orderServiceUrl}/orders/${orderId}/status`, {
            status: 'PAID',
            notes: 'Payment confirmed via webhook',
          }),
        );
        this.logger.log(`Order ${orderId} status updated to PAID`);
      } catch (error) {
        this.logger.error(`Failed to update order ${orderId} status:`, error);
        // Continue even if order update fails - payment is still recorded
      }
    }

    // Emit payment events
    if (updatedPayment.status === PaymentStatus.SUCCESS) {
      await this.rabbitMQService.publishEvent('payment.success', {
        paymentId: updatedPayment.id,
        orderId: updatedPayment.orderId,
        userId: updatedPayment.userId,
        sellerId: orderDetails?.sellerId || null,
        amount: Number(updatedPayment.amount),
        commission: orderDetails ? Number(orderDetails.commission) : 0,
        currency: updatedPayment.currency,
        gatewayId: updatedPayment.gatewayId,
      });
    } else if (updatedPayment.status === PaymentStatus.FAILED) {
      await this.rabbitMQService.publishEvent('payment.failed', {
        paymentId: updatedPayment.id,
        orderId: updatedPayment.orderId,
        userId: updatedPayment.userId,
        amount: Number(updatedPayment.amount),
        currency: updatedPayment.currency,
        failureReason: updatedPayment.failureReason,
      });
    }

    return updatedPayment;
  }

  private verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured. Skipping signature verification.');
      return true; // In development, allow if secret is not set
    }

    try {
      // Razorpay uses HMAC SHA256 for webhook signature verification
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      // Razorpay sends signature in format: sha256=<signature>
      const receivedSignature = signature.startsWith('sha256=')
        ? signature.substring(7)
        : signature;

      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Error verifying Razorpay webhook signature:', error);
      return false;
    }
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    // Legacy method for backward compatibility
    const webhookSecret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET') || 'default-secret';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  private mapRazorpayStatusToPaymentStatus(status: string, event?: string): PaymentStatus {
    // Razorpay payment statuses: created, authorized, captured, refunded, failed
    // Razorpay order statuses: created, attempted, paid
    const statusLower = status?.toLowerCase() || '';
    const eventLower = event?.toLowerCase() || '';

    // Handle payment events
    if (eventLower.includes('payment.captured') || statusLower === 'captured' || statusLower === 'paid') {
      return PaymentStatus.SUCCESS;
    }

    if (eventLower.includes('payment.failed') || statusLower === 'failed') {
      return PaymentStatus.FAILED;
    }

    if (eventLower.includes('payment.authorized') || statusLower === 'authorized') {
      return PaymentStatus.PROCESSING;
    }

    if (eventLower.includes('refund') || statusLower === 'refunded') {
      return PaymentStatus.REFUNDED;
    }

    if (statusLower === 'created' || statusLower === 'attempted' || statusLower === 'pending') {
      return PaymentStatus.PENDING;
    }

    return PaymentStatus.PENDING;
  }

  private mapGatewayStatusToPaymentStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      success: PaymentStatus.SUCCESS,
      succeeded: PaymentStatus.SUCCESS,
      completed: PaymentStatus.SUCCESS,
      captured: PaymentStatus.SUCCESS,
      paid: PaymentStatus.SUCCESS,
      failed: PaymentStatus.FAILED,
      failure: PaymentStatus.FAILED,
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      authorized: PaymentStatus.PROCESSING,
      refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[gatewayStatus.toLowerCase()] || PaymentStatus.PENDING;
  }
}

