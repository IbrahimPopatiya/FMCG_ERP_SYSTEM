"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PriceListCreate } from "@/types/priceLists";

interface PriceListFormProps {
  onSubmit: (payload: PriceListCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function PriceListForm({ onSubmit, onSuccess }: PriceListFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      onSuccess();
    } catch {
      setError("Something went wrong saving this price list. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="name" label="Price list name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        id="description"
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add price list
        </Button>
      </div>
    </form>
  );
}
