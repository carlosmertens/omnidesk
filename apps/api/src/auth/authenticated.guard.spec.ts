import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthenticatedGuard } from './authenticated.guard.js';

function makeContext(isAuthenticated: boolean): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ isAuthenticated: () => isAuthenticated }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuthenticatedGuard', () => {
  let reflector: Reflector;
  let guard: AuthenticatedGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthenticatedGuard(reflector);
  });

  it('lets a @Public() route through without checking the session', () => {
    const context = makeContext(false);
    reflector.getAllAndOverride = () => true;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an authenticated request on a non-public route', () => {
    const context = makeContext(true);
    reflector.getAllAndOverride = () => undefined;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects an unauthenticated request on a non-public route', () => {
    const context = makeContext(false);
    reflector.getAllAndOverride = () => undefined;

    expect(() => guard.canActivate(context)).toThrow('Unauthorized');
  });
});
