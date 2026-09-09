import type { SafeUser } from '../users/safe-user.util.js';

declare global {
  namespace Express {
    interface User extends SafeUser {}
  }
}
