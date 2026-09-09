import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

// Only meaningful on routes behind the global AuthenticatedGuard (or a
// route-scoped auth guard), which guarantee req.user is populated — this is
// the hook every future tenant-scoped query should go through instead of
// trusting a workspaceId from the client, since there's no Postgres RLS.
export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    return (request.user as Express.User).workspaceId;
  },
);
