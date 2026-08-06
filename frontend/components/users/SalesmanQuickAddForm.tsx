"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserCreate } from "@/types/users";

interface SalesmanFormValues {
  full_name: string;
  mobile: string;
  password: string;
}

const EMPTY_FORM: SalesmanFormValues = { full_name: "", mobile: "", password: "" };

// The backend's User model requires a unique email, but a salesman only ever
// logs in with mobile + password (see auth service) - so instead of asking
// the admin to type one, derive a unique placeholder from the mobile number.
function toPayload(values: SalesmanFormValues): UserCreate {
  const mobile = values.mobile.trim();
  return {
    full_name: values.full_name.trim(),
    mobile,
    email: `${mobile}@salesman.internal`,
    password: values.password,
    role: "salesman",
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A staff account with this mobile already exists.";
  }
  return "Something went wrong creating this account. Please try again.";
}

interface SalesmanQuickAddFormProps {
  onSubmit: (payload: UserCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function SalesmanQuickAddForm({ onSubmit, onSuccess }: SalesmanQuickAddFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SalesmanFormValues>(key: K, value: SalesmanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values));
      setValues(EMPTY_FORM);
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        id="salesman_full_name"
        label="Salesman name"
        placeholder="e.g. Ramesh Kumar"
        value={values.full_name}
        onChange={(e) => set("full_name", e.target.value)}
        required
      />
      <Input
        id="salesman_mobile"
        label="Mobile number"
        placeholder="9876543210"
        value={values.mobile}
        onChange={(e) => set("mobile", e.target.value)}
        required
      />
      <Input
        id="salesman_password"
        label="Login password"
        type="password"
        value={values.password}
        onChange={(e) => set("password", e.target.value)}
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add salesman
        </Button>
      </div>
    </form>
  );
}
