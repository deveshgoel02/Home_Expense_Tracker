import { useState } from "react";
import toast from "react-hot-toast";
import { useCategories } from "../../hooks/useCategories";
import { useCreateBudget } from "../../hooks/useBudgets";
import { Input, Select } from "../ui/Field";
import { Button } from "../ui/Button";

interface BudgetFormProps {
  month: number;
  year: number;
  existingCategoryIds: string[];
  onDone: () => void;
}

export function BudgetForm({ month, year, existingCategoryIds, onDone }: BudgetFormProps) {
  const { data: categories = [] } = useCategories();
  const createBudget = useCreateBudget();

  const availableCategories = categories.filter((c) => !existingCategoryIds.includes(c.id));

  const [categoryId, setCategoryId] = useState(availableCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!categoryId) next.categoryId = "Select a category.";
    if (!amount || Number(amount) <= 0) next.amount = "Enter a budget amount greater than zero.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await createBudget.mutateAsync({ categoryId, month, year, amount: Number(amount) });
      toast.success("Budget added");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (availableCategories.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">All categories already have a budget for this month.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={errors.categoryId}>
        {availableCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input
        label="Monthly Budget Amount"
        required
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createBudget.isPending}>
          {createBudget.isPending ? "Saving..." : "Add Budget"}
        </Button>
      </div>
    </form>
  );
}
