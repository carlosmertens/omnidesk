import { useState } from 'react';
import { apiGet } from '../lib/api';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

type HealthResponse = {
  status: 'ok';
  timestamp: string;
};

type CheckState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'success'; data: HealthResponse }
  | { phase: 'error'; message: string };

export function BackendHealthCheck() {
  const [state, setState] = useState<CheckState>({ phase: 'idle' });

  async function checkHealth() {
    setState({ phase: 'loading' });
    try {
      const data = await apiGet<HealthResponse>('/health');
      setState({ phase: 'success', data });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Backend connection check</CardTitle>
        <CardDescription>
          Calls GET /api/health on the NestJS API.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button onClick={checkHealth} disabled={state.phase === 'loading'}>
          {state.phase === 'loading' ? 'Checking…' : 'Check backend health'}
        </Button>
        {state.phase === 'success' && (
          <p className="text-sm text-emerald-600">
            ✅ {state.data.status} — {state.data.timestamp}
          </p>
        )}
        {state.phase === 'error' && (
          <p className="text-sm text-destructive">❌ {state.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
