"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin, loginErrorMessage } from "@/lib/hooks/useLogin";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loginMutation.mutate(
      { identifier: identifier.trim(), password },
      {
        onSuccess: (data) => {
          const destination = data.principal_type === "customer" ? "/home" : "/admin/dashboard";
          window.location.assign(destination);
        },
      }
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold tracking-tight text-white">
          DMS
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-muted">Log in to your distribution account</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="identifier"
            label="Mobile number or email"
            type="text"
            autoComplete="username"
            placeholder="e.g. 9876543210"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="text-xs font-medium text-ink-muted hover:text-ink"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />

          {loginMutation.isError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {loginErrorMessage(loginMutation.error)}
            </div>
          )}

          <Button type="submit" isLoading={loginMutation.isPending} className="mt-1 w-full">
            Log in
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted/70">
        Don&apos;t have access yet? Contact your distributor administrator.
      </p>
    </div>
  );
}
