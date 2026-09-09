import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { SafeUser } from '../users/safe-user.util.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(
    user: SafeUser,
    done: (err: Error | null, id: string) => void,
  ): void {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, user: SafeUser | null) => void,
  ): Promise<void> {
    const user = await this.authService.findSafeUserById(id);
    done(null, user);
  }
}
