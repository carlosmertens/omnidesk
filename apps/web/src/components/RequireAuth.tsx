import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../lib/auth-context';

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return null;
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
