"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { BrandCreate } from "@/types/brands";

interface BrandFormProps {
  onSubmit: (payload: BrandCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function BrandForm({ onSubmit, onSuccess }: BrandFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
      setName("");
      onSuccess();
    } catch {
      setError("Something went wrong saving this brand. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="name" label="Brand name" value={name} onChange={(e) => setName(e.target.value)} required />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add brand
        </Button>
      </div>
    </form>
  );
}
