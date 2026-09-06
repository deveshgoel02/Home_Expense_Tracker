import { useState } from "react";
import toast from "react-hot-toast";
import { useUsers } from "../../hooks/useUsers";
import { useCreateIncome, useUpdateIncome } from "../../hooks/useIncome";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import type { Income } from "../../types";
import { MONTH_NAMES } from "../../lib/format";

interface IncomeFormProps {
  existing?: Income;
  defaultMonth: number;
  defaultYear: number;
  onDone: () => void;
}

export function IncomeForm({ existing, defaultMonth, defaultYear, onDone }: IncomeFormProps) {
  const { data: users = [] } = useUsers();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();

  const [month, setMonth] = useState(existing?.month ?? defaultMonth);
  const [year, setYear] = useState(existing?.year ?? defaultYear);
  const [amount, setAmount] = useState(existing ? String(existing.amountPaise / 100) : "");
  const [source, setSource] = useState(existing?.source ?? "");
  const [userId, setUserId] = useState(existing?.userId ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSaving = createIncome.isPending || updateIncome.isPending;

  function validate() {
    const next: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) next.amount = "Enter an amount greater than zero.";
    if (!source.trim()) next.source = "Please describe the income source.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      month,
      year,
      amount: Number(amount),
      source: source.trim(),
      userId: userId || null,
      notes: notes.trim() || null,
    };

    try {
      if (existing) {
        await updateIncome.mutateAsync({ id: existing.id, data: payload });
        toast.success("Income updated");
      } else {
        await createIncome.mutateAsync(payload);
        toast.success("Income added");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </Select>
        <Input label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      <Input
        label="Amount"
        required
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
      />

      <Select label="Person (optional)" value={userId} onChange={(e) => setUserId(e.target.value)}>
        <option value="">Family / Other Income</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>

      <Input
        label="Source"
        required
        placeholder="e.g. Salary, Business Income, Rental Income"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        error={errors.source}
      />

      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : existing ? "Save Changes" : "Add Income"}
        </Button>
      </div>
    </form>
  );
}
