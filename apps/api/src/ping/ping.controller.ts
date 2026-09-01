import { Body, Controller, Post } from '@nestjs/common';
import { PingRequestDto } from './ping.schema.js';

@Controller('ping')
export class PingController {
  @Post()
  echo(@Body() body: PingRequestDto) {
    return { echoed: body.message };
  }
}
