import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post()
  create(@Body() createShareLinkDto: CreateShareLinkDto) {
    return this.shareLinksService.create(createShareLinkDto);
  }

  @Get(':code')
  findByCode(
    @Param('code') code: string,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.shareLinksService.findByCode(code, ipAddress, userAgent, referer);
  }

  @Get()
  findBySeller(@Query('sellerId') sellerId: string) {
    return this.shareLinksService.findBySeller(sellerId);
  }

  @Get(':code/stats')
  getStats(@Param('code') code: string) {
    return this.shareLinksService.getStats(code);
  }
}

