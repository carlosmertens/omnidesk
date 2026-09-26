import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { toSafeUser } from './safe-user.util.js';
import { CreateUserDto, UserResponseDto } from './users.schema.js';
import { UsersService } from './users.service.js';

@UseGuards(RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ZodResponse({ status: 201, type: UserResponseDto })
  async create(@Body() body: CreateUserDto) {
    const user = await this.usersService.create(body);
    return toSafeUser(user);
  }

  @Get()
  @ZodResponse({ status: 200, type: [UserResponseDto] })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(toSafeUser);
  }
}
