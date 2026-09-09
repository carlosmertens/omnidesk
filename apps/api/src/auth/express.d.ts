import type { SafeUser } from './auth.service.js';

declare global {
  namespace Express {
    interface User extends SafeUser {}
  }
}
