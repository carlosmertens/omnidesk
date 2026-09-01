import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PingRequestSchema = z.object({
  message: z.string().min(1, 'message is required'),
});

export class PingRequestDto extends createZodDto(PingRequestSchema) {}
