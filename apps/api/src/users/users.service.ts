import { Injectable } from '@nestjs/common';
import type { User, UserRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword } from './password.util.js';

export interface CreateUserInput {
  workspaceId: string;
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await hashPassword(input.password);

    return this.prisma.user.create({
      data: {
        workspaceId: input.workspaceId,
        email: input.email,
        passwordHash,
        role: input.role,
      },
    });
  }

  findByEmail(workspaceId: string, email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAllByWorkspace(workspaceId: string): Promise<User[]> {
    return this.prisma.user.findMany({ where: { workspaceId } });
  }
}
