import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'ASSOCIATE']),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(['ADMIN', 'ASSOCIATE']),
  workspaceId: z.string(),
});

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
