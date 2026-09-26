import { Outlet } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const ROLE_LABELS = { ADMIN: 'Admin', ASSOCIATE: 'Associate' } as const;

// Chrome for every signed-in page. Only rendered behind RequireAuth, so the
// user is always present here.
export function AppShell() {
  const { state, logout } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex h-14 items-center justify-between px-6">
          <span className="font-heading font-semibold">OmniDesk</span>
          {user && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" title={user.email}>
                {ROLE_LABELS[user.role]}
              </Badge>
              <Button variant="outline" onClick={logout}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
