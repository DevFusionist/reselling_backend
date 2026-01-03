import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UserInfoMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract user info from header (set by API Gateway after JWT validation)
    const userInfoHeader = req.headers['x-user-info'];
    
    if (userInfoHeader && typeof userInfoHeader === 'string') {
      try {
        const userInfo = JSON.parse(userInfoHeader);
        console.log('userInfo', userInfo);
        // Attach user info to request object for guards to use
        (req as any).user = userInfo;
      } catch (error) {
        // If parsing fails, just continue without user info
        // Guards will handle authorization appropriately
      }
    }
    
    next();
  }
}

