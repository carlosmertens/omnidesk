import { BackendHealthCheck } from './components/BackendHealthCheck';

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">OmniDesk</h1>
        <p className="text-muted-foreground">
          AI-native helpdesk — early scaffolding stage.
        </p>
      </div>
      <BackendHealthCheck />
    </main>
  );
}

export default App;
