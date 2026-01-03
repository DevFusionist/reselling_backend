import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { PayoutStatus } from '../../generated/prisma';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get(':sellerId')
  getWallet(@Param('sellerId') sellerId: string) {
    return this.walletsService.getWallet(sellerId);
  }

  @Get(':sellerId/transactions')
  getTransactions(
    @Param('sellerId') sellerId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.walletsService.getTransactions(sellerId, skip, take);
  }

  @Post(':sellerId/payouts')
  createPayoutRequest(
    @Param('sellerId') sellerId: string,
    @Body() createPayoutRequestDto: CreatePayoutRequestDto,
  ) {
    return this.walletsService.createPayoutRequest(sellerId, createPayoutRequestDto);
  }

  @Get('payouts')
  getPayoutRequests(@Query('sellerId') sellerId?: string, @Query('status') status?: PayoutStatus) {
    return this.walletsService.getPayoutRequests(sellerId, status);
  }

  @Patch('payouts/:id')
  updatePayoutStatus(
    @Param('id') id: string,
    @Body() updatePayoutStatusDto: UpdatePayoutStatusDto,
  ) {
    return this.walletsService.updatePayoutStatus(id, updatePayoutStatusDto);
  }
}

