import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-local';
import type { SafeUser } from '../users/safe-user.util.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<SafeUser> {
    const workspaceId = req.body?.workspaceId;
    if (typeof workspaceId !== 'string' || workspaceId.length === 0) {
      throw new UnauthorizedException('workspaceId is required');
    }

    const user = await this.authService.validateUser(
      workspaceId,
      email,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
