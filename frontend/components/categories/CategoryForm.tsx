"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { CategoryCreate, CategoryResponse } from "@/types/categories";

interface CategoryFormProps {
  categories: CategoryResponse[];
  onSubmit: (payload: CategoryCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function CategoryForm({ categories, onSubmit, onSuccess }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), parent_id: parentId || null });
      setName("");
      setParentId("");
      onSuccess();
    } catch {
      setError("Something went wrong saving this category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="name" label="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select
        id="parent_id"
        label="Parent category (optional)"
        value={parentId}
        onValueChange={setParentId}
        placeholder="No parent"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add category
        </Button>
      </div>
    </form>
  );
}
