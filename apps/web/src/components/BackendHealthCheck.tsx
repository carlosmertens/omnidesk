import { useState } from 'react';
import { apiGet } from '../lib/api';

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
    <section style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, margin: '16px 0' }}>
      <h2>Backend connection check</h2>
      <button type="button" onClick={checkHealth} disabled={state.phase === 'loading'}>
        {state.phase === 'loading' ? 'Checking…' : 'Check backend health'}
      </button>
      {state.phase === 'success' && (
        <p style={{ color: 'green' }}>
          ✅ {state.data.status} — {state.data.timestamp}
        </p>
      )}
      {state.phase === 'error' && <p style={{ color: 'red' }}>❌ {state.message}</p>}
    </section>
  );
}
