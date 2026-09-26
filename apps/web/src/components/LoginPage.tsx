import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// All validation lives here (via zodResolver) — the form sets noValidate so
// the browser's built-in checks (e.g. type="email") never run first.
const loginSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === '' ? 'Email is required' : 'Enter a valid email',
  }),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      const redirectTo =
        (location.state as { from?: { pathname: string } } | null)?.from
          ?.pathname ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Login failed',
      });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl bg-card p-10 shadow-sm ring-1 ring-foreground/5">
        <h1 className="text-2xl font-bold tracking-tight">OmniDesk</h1>
        <p className="mt-1 text-muted-foreground">Sign in to your account</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-8 flex flex-col gap-5"
        >
          {errors.root && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-10 px-3"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-10 px-3"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
