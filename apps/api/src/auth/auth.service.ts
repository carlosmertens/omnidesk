import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { UsersService } from '../users/users.service.js';
import { comparePassword } from '../users/password.util.js';

export type SafeUser = Omit<User, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

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
