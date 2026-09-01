import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}
