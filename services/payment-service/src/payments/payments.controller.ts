import { Controller, Get, Post, Body, Param, Query, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../../generated/prisma';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('razorpay/create-order')
  createRazorpayOrder(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createRazorpayOrder(createPaymentDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Query('status') status?: PaymentStatus) {
    return this.paymentsService.findAll(userId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrderId(orderId);
  }

  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    return this.paymentsService.handleWebhook(payload, signature, rawBody);
  }
}

