import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import { UserResponseDto } from '../users/users.schema.js';
import { LoginDto } from './auth.schema.js';
import { LocalAuthGuard } from './local-auth.guard.js';
import { Public } from './public.decorator.js';

// The whole /auth/* prefix is exempt from the global AuthenticatedGuard —
// login has to work before a session exists, and logout/me manage their own
// auth check (req.isAuthenticated()) rather than relying on the guard.
@Public()
@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ZodResponse({ status: 200, type: UserResponseDto })
  login(@Body() _body: LoginDto, @Req() req: Request) {
    // LocalAuthGuard has already run passport's LocalStrategy and populated req.user.
    return req.user as Express.User;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => (err ? reject(err) : resolve()));
    });
    // req.logout() only clears req.user — destroy the session outright so the
    // old session id can't be reused, then drop the now-invalid cookie.
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie('connect.sid');
    return { ok: true };
  }

  @Get('me')
  @ZodResponse({ status: 200, type: UserResponseDto })
  me(@Req() req: Request) {
    if (!req.isAuthenticated()) {
      throw new UnauthorizedException();
    }
    return req.user as Express.User;
  }
}
