import { Controller, Get, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  getNotifications(
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.notificationsService.getNotifications(userId, skip, take);
  }
}

