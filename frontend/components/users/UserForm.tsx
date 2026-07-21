"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { UserCreate, UserRole } from "@/types/users";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "salesman", label: "Salesman" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "driver", label: "Driver" },
  { value: "cashier", label: "Cashier" },
];

interface UserFormValues {
  full_name: string;
  mobile: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: UserFormValues = {
  full_name: "",
  mobile: "",
  email: "",
  password: "",
  role: "salesman",
};

function toPayload(values: UserFormValues): UserCreate {
  return {
    full_name: values.full_name.trim(),
    mobile: values.mobile.trim(),
    email: values.email.trim(),
    password: values.password,
    role: values.role,
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A staff account with this mobile or email already exists.";
  }
  return "Something went wrong creating this account. Please try again.";
}

interface UserFormProps {
  onSubmit: (payload: UserCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function UserForm({ onSubmit, onSuccess }: UserFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
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
        id="full_name"
        label="Full name"
        placeholder="e.g. Ramesh Kumar"
        value={values.full_name}
        onChange={(e) => set("full_name", e.target.value)}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="mobile"
          label="Mobile"
          placeholder="9876543210"
          value={values.mobile}
          onChange={(e) => set("mobile", e.target.value)}
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="ramesh@example.com"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="password"
          label="Temporary password"
          type="password"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          required
        />
        <Select
          id="role"
          label="Role"
          value={values.role}
          onValueChange={(v) => set("role", v as UserRole)}
          options={ROLE_OPTIONS}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Create account
        </Button>
      </div>
    </form>
  );
}
