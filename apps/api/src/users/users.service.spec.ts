import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('hashes the plaintext password before writing it to the database', async () => {
    prisma.user.create.mockResolvedValue({ id: 'user_1' });

    await service.create({
      workspaceId: 'workspace_1',
      email: 'admin@example.com',
      password: 'correct-horse-battery-staple',
      role: 'ADMIN',
    });

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    const { data } = prisma.user.create.mock.calls[0][0];
    expect(data.passwordHash).not.toBe('correct-horse-battery-staple');
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(data).toMatchObject({
      workspaceId: 'workspace_1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  it('looks up a user by workspace-scoped email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await service.findByEmail('workspace_1', 'admin@example.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_email: { workspaceId: 'workspace_1', email: 'admin@example.com' },
      },
    });
  });
});
