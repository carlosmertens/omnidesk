import { Outlet } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';

const ROLE_LABELS = { ADMIN: 'Admin', ASSOCIATE: 'Associate' } as const;

// Chrome for every signed-in page. Only rendered behind RequireAuth, so the
// user is always present here.
export function AppShell() {
  const { state, logout } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="flex h-14 items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">OmniDesk</span>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-primary-foreground/80" title={user.email}>
                {ROLE_LABELS[user.role]}
              </span>
              <Button
                variant="outline"
                onClick={logout}
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
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
