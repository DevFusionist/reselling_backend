import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../../generated/prisma';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private rabbitMQService: RabbitMQService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Validate pricing via Pricing Service (localhost for local development)
    const pricingServiceUrl = this.configService.get<string>('PRICING_SERVICE_URL') || 'http://localhost:3003';
    
    const calculateDto = {
      items: createOrderDto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        sellerPrice: item.sellerPrice,
      })),
      sellerId: createOrderDto.sellerId || createOrderDto.userId,
    };

    let pricingResult;
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${pricingServiceUrl}/pricing/calculate`, calculateDto),
      );
      pricingResult = response.data;
    } catch (error) {
      throw new BadRequestException(
        `Pricing validation failed: ${error.response?.data?.message || error.message}`,
      );
    }

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: createOrderDto.userId,
        sellerId: createOrderDto.sellerId,
        shareLinkId: createOrderDto.shareLinkId,
        status: OrderStatus.PENDING,
        totalAmount: pricingResult.summary.totalAmount,
        commission: pricingResult.summary.totalCommission,
        currency: 'USD',
        shippingAddress: createOrderDto.shippingAddress,
        items: {
          create: pricingResult.items.map((item: any, index: number) => ({
            productId: createOrderDto.items[index].productId,
            variantId: createOrderDto.items[index].variantId,
            quantity: item.quantity,
            unitPrice: item.sellerPrice,
            totalPrice: item.itemTotal,
            commission: item.commission,
          })),
        },
        statusLogs: {
          create: {
            status: OrderStatus.PENDING,
            notes: 'Order created',
          },
        },
      },
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Emit ORDER_CREATED event
    await this.rabbitMQService.publishEvent('order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      sellerId: order.sellerId,
      shareLinkId: order.shareLinkId,
      totalAmount: Number(order.totalAmount),
      commission: Number(order.commission),
      currency: order.currency,
    });

    return order;
  }

  async findAll(userId?: string, sellerId?: string, status?: OrderStatus, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size to prevent memory issues
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitedTake,
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          sellerId: true,
          shareLinkId: true,
          status: true,
          totalAmount: true,
          commission: true,
          currency: true,
          shippingAddress: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              commission: true,
            },
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5, // Limit to last 5 status logs
            select: {
              id: true,
              status: true,
              notes: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      skip,
      take: limitedTake,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderStatusDto.status,
        statusLogs: {
          create: {
            status: updateOrderStatusDto.status,
            notes: updateOrderStatusDto.notes,
          },
        },
      },
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Emit appropriate event based on status
    await this.emitStatusEvent(updateOrderStatusDto.status, order);

    return updatedOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async emitStatusEvent(status: OrderStatus, order: any) {
    const eventData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      sellerId: order.sellerId,
      totalAmount: Number(order.totalAmount),
      commission: Number(order.commission),
      currency: order.currency,
    };

    switch (status) {
      case OrderStatus.PAID:
        await this.rabbitMQService.publishEvent('order.paid', eventData);
        break;
      case OrderStatus.DELIVERED:
        await this.rabbitMQService.publishEvent('order.delivered', eventData);
        break;
      case OrderStatus.CANCELLED:
        await this.rabbitMQService.publishEvent('order.cancelled', eventData);
        break;
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}

