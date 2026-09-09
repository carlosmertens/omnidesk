import { BackendHealthCheck } from './components/BackendHealthCheck';
import { Button } from './components/ui/button';
import { useAuth } from './lib/auth-context';

function App() {
  const { state, logout } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">OmniDesk</h1>
        <p className="text-muted-foreground">
          AI-native helpdesk — early scaffolding stage.
        </p>
      </div>
      {user && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            Signed in as {user.email} ({user.role})
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      )}
      <BackendHealthCheck />
    </main>
  );
}

export default App;
