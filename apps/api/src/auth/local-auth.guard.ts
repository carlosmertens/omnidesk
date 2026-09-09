import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // @nestjs/passport's AuthGuard invokes passport.authenticate() with a custom
  // callback, which makes passport skip its usual automatic req.login() call —
  // so session establishment has to be triggered explicitly here.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = (await super.canActivate(context)) as boolean;
    await super.logIn(context.switchToHttp().getRequest());
    return canActivate;
  }
}
