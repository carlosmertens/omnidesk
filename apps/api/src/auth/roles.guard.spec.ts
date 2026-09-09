import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function makeContext(user: { role: string } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows the request through when the route has no @Roles() metadata', () => {
    const context = makeContext({ role: 'ASSOCIATE' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a request whose user role is in the required list', () => {
    const context = makeContext({ role: 'ADMIN' });
    reflector.getAllAndOverride = () => ['ADMIN'];

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a request whose user role is not in the required list', () => {
    const context = makeContext({ role: 'ASSOCIATE' });
    reflector.getAllAndOverride = () => ['ADMIN'];

    expect(() => guard.canActivate(context)).toThrow('Forbidden');
  });

  it('rejects a request with no user on it', () => {
    const context = makeContext(undefined);
    reflector.getAllAndOverride = () => ['ADMIN'];

    expect(() => guard.canActivate(context)).toThrow('Forbidden');
  });
});
