import { Injectable } from '@nestjs/common';
import { comparePassword } from '../users/password.util.js';
import type { SafeUser } from '../users/safe-user.util.js';
import { toSafeUser } from '../users/safe-user.util.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(
    workspaceId: string,
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.usersService.findByEmail(workspaceId, email);
    if (!user) {
      return null;
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    return toSafeUser(user);
  }

  async findSafeUserById(id: string): Promise<SafeUser | null> {
    const user = await this.usersService.findById(id);
    return user ? toSafeUser(user) : null;
  }
}
