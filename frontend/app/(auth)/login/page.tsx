// TODO: build the login form (mobile identifier or email + password) using
// components/ui primitives and lib/api/auth.ts, then call setSession() from
// lib/auth/session.ts and redirect based on role.
export default function LoginPage() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">Log in</h1>
      <p className="mt-1 text-sm text-zinc-500">Login form goes here.</p>
    </div>
  );
}
