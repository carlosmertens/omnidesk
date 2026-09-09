import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { Public } from '../auth/public.decorator.js';
import { HealthResponseDto } from './health.schema.js';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ZodResponse({ status: 200, type: HealthResponseDto })
  check(): HealthResponseDto {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
