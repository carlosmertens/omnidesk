import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';
import App from './App.tsx';
import { Layout } from './components/Layout.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RequireAuth } from './components/RequireAuth.tsx';
import { AuthProvider } from './lib/auth-context.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route index element={<App />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
