import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { HealthResponseDto } from './health.schema.js';

@Controller('health')
export class HealthController {
  @Get()
  @ZodResponse({ status: 200, type: HealthResponseDto })
  check(): HealthResponseDto {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
