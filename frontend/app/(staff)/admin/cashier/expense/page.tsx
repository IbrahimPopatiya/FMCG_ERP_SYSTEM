"use client";

import { useState } from "react";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const CATEGORIES = ["Fuel", "Food", "Loading", "Stationery", "Transport", "Other"] as const;
type Category = (typeof CATEGORIES)[number];
const PAID_BY_OPTIONS = ["Cash", "UPI"] as const;

interface LocalExpense {
  id: string;
  category: Category;
  description: string;
  amount: number;
  paidBy: string;
  addedAt: string;
}

// UI-only for now - there's no Expense domain in the backend yet
// (see final_docs/role_based_frontend_plan.md §5). Entries live only in this
// page's state and are gone on refresh; wire this up to a real API once
// that domain exists.
export default function CashierExpensePage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const [category, setCategory] = useState<Category>("Fuel");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string>("Cash");
  const [entries, setEntries] = useState<LocalExpense[]>([]);

  const amountValue = Number(amount);
  const canSave = description.trim().length > 0 && amountValue > 0;
  const todayTotal = entries.reduce((sum, e) => sum + e.amount, 0);

  function handleSave() {
    if (!canSave) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), category, description: description.trim(), amount: amountValue, paidBy, addedAt: new Date().toISOString() },
      ...prev,
    ]);
    setDescription("");
    setAmount("");
  }

  return (
    <div>
      <CashierTopBar title="Add Expense" />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
          Demo only — entries aren&apos;t saved to the server yet, they&apos;ll disappear on refresh.
        </div>

        <Card className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-muted">Expense Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                    category === c
                      ? "border-primary bg-primary text-white"
                      : "border-border text-ink-muted hover:bg-surface"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Expense Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">Paid By</label>
            <div className="flex gap-2">
              {PAID_BY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPaidBy(option)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    paidBy === option
                      ? "border-primary bg-primary text-white"
                      : "border-border text-ink-muted hover:bg-surface"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save Expense
          </Button>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Today&apos;s expenses</h2>
            {entries.length > 0 && <p className="text-sm font-semibold text-ink">{formatCurrency(todayTotal)}</p>}
          </div>
          {entries.length === 0 ? (
            <Card className="text-sm text-ink-muted">No expenses added yet.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((e) => (
                <Card key={e.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{e.description}</p>
                    <p className="text-xs text-ink-muted">{e.category} • {e.paidBy}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(e.amount)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
