import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { TransactionType, PayoutStatus } from '../../generated/prisma';

@Injectable()
export class WalletsService implements OnModuleInit {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private prisma: PrismaService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    // Start consuming events
    await this.rabbitMQService.consumeEvents(async (message, routingKey) => {
      await this.handleEvent(message, routingKey);
    });
  }

  private async handleEvent(message: any, routingKey: string) {
    this.logger.log(`Received event: ${routingKey}`);

    if (routingKey === 'payment.success') {
      await this.handlePaymentSuccess(message.data);
    } else if (routingKey === 'order.delivered') {
      await this.handleOrderDelivered(message.data);
    } else if (routingKey === 'order.cancelled') {
      await this.handleOrderCancelled(message.data);
    }
  }

  private async handlePaymentSuccess(data: any) {
    const { orderId, sellerId, amount, commission } = data;

    if (!sellerId) {
      this.logger.warn(`No sellerId in payment success event for order ${orderId}`);
      return;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    let wallet = await this.prisma.wallet.findUnique({
      where: { sellerId },
      select: {
        id: true,
        pendingBalance: true,
        availableBalance: true,
      },
    });

    if (!wallet) {
      // OPTIMIZATION: Use select to fetch only required fields
      wallet = await this.prisma.wallet.create({
        data: {
          sellerId,
          pendingBalance: 0,
          availableBalance: 0,
        },
        select: {
          id: true,
          pendingBalance: true,
          availableBalance: true,
        },
      });
    }

    // Lock commission (add to pending balance)
    const newPendingBalance = Number(wallet.pendingBalance) + Number(commission);

    await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: newPendingBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId,
          type: TransactionType.COMMISSION_CREATED,
          amount: commission,
          balanceBefore: wallet.pendingBalance,
          balanceAfter: newPendingBalance,
          description: `Commission locked for order ${orderId}`,
          metadata: JSON.stringify({ orderId, amount, commission }),
        },
      });

      // Emit commission created event
      await this.rabbitMQService.publishEvent('wallet.commission.created', {
        walletId: wallet.id,
        sellerId,
        orderId,
        commission: Number(commission),
        pendingBalance: Number(updatedWallet.pendingBalance),
      });
    });

    this.logger.log(`Commission locked for seller ${sellerId}, order ${orderId}`);
  }

  private async handleOrderDelivered(data: any) {
    const { orderId, sellerId, commission } = data;

    if (!sellerId) {
      return;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const wallet = await this.prisma.wallet.findUnique({
      where: { sellerId },
      select: {
        id: true,
        pendingBalance: true,
        availableBalance: true,
      },
    });

    if (!wallet) {
      this.logger.warn(`Wallet not found for seller ${sellerId}`);
      return;
    }

    // Unlock commission (move from pending to available)
    const newPendingBalance = Math.max(0, Number(wallet.pendingBalance) - Number(commission));
    const newAvailableBalance = Number(wallet.availableBalance) + Number(commission);

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: newPendingBalance,
          availableBalance: newAvailableBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId,
          type: TransactionType.COMMISSION_UNLOCKED,
          amount: commission,
          balanceBefore: wallet.availableBalance,
          balanceAfter: newAvailableBalance,
          description: `Commission unlocked for order ${orderId}`,
          metadata: JSON.stringify({ orderId, commission }),
        },
      });
    });

    // Emit commission unlocked event
    await this.rabbitMQService.publishEvent('wallet.commission.unlocked', {
      walletId: wallet.id,
      sellerId,
      orderId,
      commission: Number(commission),
      availableBalance: newAvailableBalance,
    });

    this.logger.log(`Commission unlocked for seller ${sellerId}, order ${orderId}`);
  }

  private async handleOrderCancelled(data: any) {
    const { orderId, sellerId, commission } = data;

    if (!sellerId) {
      return;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const wallet = await this.prisma.wallet.findUnique({
      where: { sellerId },
      select: {
        id: true,
        pendingBalance: true,
        availableBalance: true,
      },
    });

    if (!wallet) {
      return;
    }

    // Refund commission (remove from pending)
    const newPendingBalance = Math.max(0, Number(wallet.pendingBalance) - Number(commission));

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: newPendingBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId,
          type: TransactionType.REFUND,
          amount: -Number(commission),
          balanceBefore: wallet.pendingBalance,
          balanceAfter: newPendingBalance,
          description: `Commission refunded for cancelled order ${orderId}`,
          metadata: JSON.stringify({ orderId, commission }),
        },
      });
    });

    this.logger.log(`Commission refunded for seller ${sellerId}, order ${orderId}`);
  }

  async getWallet(sellerId: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    let wallet = await this.prisma.wallet.findUnique({
      where: { sellerId },
      select: {
        id: true,
        sellerId: true,
        pendingBalance: true,
        availableBalance: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderId: true,
            type: true,
            amount: true,
            balanceBefore: true,
            balanceAfter: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      // OPTIMIZATION: Use select to fetch only required fields
      wallet = await this.prisma.wallet.create({
        data: {
          sellerId,
          pendingBalance: 0,
          availableBalance: 0,
        },
        select: {
          id: true,
          sellerId: true,
          pendingBalance: true,
          availableBalance: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              orderId: true,
              type: true,
              amount: true,
              balanceBefore: true,
              balanceAfter: true,
              description: true,
              createdAt: true,
            },
          },
        },
      });
    }

    return wallet;
  }

  async getTransactions(sellerId: string, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    const wallet = await this.prisma.wallet.findUnique({
      where: { sellerId },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for seller ${sellerId}`);
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limitedTake,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      data: transactions,
      total,
      skip,
      take: limitedTake,
    };
  }

  async createPayoutRequest(sellerId: string, createPayoutRequestDto: CreatePayoutRequestDto) {
    const wallet = await this.getWallet(sellerId);

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for seller ${sellerId}`);
    }

    if (Number(wallet.availableBalance) < createPayoutRequestDto.amount) {
      throw new BadRequestException('Insufficient available balance');
    }

    const payoutRequest = await this.prisma.payoutRequest.create({
      data: {
        walletId: wallet.id,
        amount: createPayoutRequestDto.amount,
        bankAccount: createPayoutRequestDto.bankAccount,
        notes: createPayoutRequestDto.notes,
        status: PayoutStatus.PENDING,
      },
    });

    return payoutRequest;
  }

  async updatePayoutStatus(payoutId: string, updatePayoutStatusDto: UpdatePayoutStatusDto) {
    // OPTIMIZATION: Use select to fetch only required fields
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        walletId: true,
        amount: true,
        status: true,
        wallet: {
          select: {
            id: true,
            availableBalance: true,
          },
        },
      },
    });

    if (!payoutRequest) {
      throw new NotFoundException(`Payout request ${payoutId} not found`);
    }

    if (payoutRequest.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Only pending payout requests can be updated');
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const updatedPayout = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: updatePayoutStatusDto.status,
        notes: updatePayoutStatusDto.notes,
        processedAt: updatePayoutStatusDto.status === PayoutStatus.PROCESSED ? new Date() : null,
      },
      select: {
        id: true,
        walletId: true,
        amount: true,
        status: true,
        bankAccount: true,
        notes: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If approved and processed, deduct from available balance
    if (updatePayoutStatusDto.status === PayoutStatus.PROCESSED) {
      const newAvailableBalance = Number(payoutRequest.wallet.availableBalance) - Number(payoutRequest.amount);

      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: payoutRequest.walletId },
          data: {
            availableBalance: newAvailableBalance,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: payoutRequest.walletId,
            type: TransactionType.PAYOUT_PROCESSED,
            amount: -Number(payoutRequest.amount),
            balanceBefore: payoutRequest.wallet.availableBalance,
            balanceAfter: newAvailableBalance,
            description: `Payout processed: ${payoutId}`,
            metadata: JSON.stringify({ payoutId }),
          },
        });
      });
    }

    return updatedPayout;
  }

  async getPayoutRequests(sellerId?: string, status?: PayoutStatus, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    const where: any = {};

    if (sellerId) {
      // OPTIMIZATION: Use select to fetch only wallet ID
      const wallet = await this.prisma.wallet.findUnique({
        where: { sellerId },
        select: { id: true },
      });

      if (!wallet) {
        return { data: [], total: 0, skip, take: limitedTake };
      }

      where.walletId = wallet.id;
    }

    if (status) {
      where.status = status;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const [data, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limitedTake,
        select: {
          id: true,
          walletId: true,
          amount: true,
          status: true,
          bankAccount: true,
          notes: true,
          processedAt: true,
          createdAt: true,
          updatedAt: true,
          wallet: {
            select: {
              id: true,
              sellerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return { data, total, skip, take: limitedTake };
  }
}

