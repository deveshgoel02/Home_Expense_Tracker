import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUsers } from "../../hooks/useUsers";
import { useCategories } from "../../hooks/useCategories";
import { useCreateExpense, useUpdateExpense } from "../../hooks/useExpenses";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { PAYMENT_METHODS } from "../../types";
import { toDateInputValue } from "../../lib/format";
import type { Expense } from "../../types";

interface ExpenseFormProps {
  existing?: Expense;
  onDone: () => void;
}

export function ExpenseForm({ existing, onDone }: ExpenseFormProps) {
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();
  const { currentUser } = useCurrentUser();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const [userId, setUserId] = useState(existing?.userId ?? currentUser?.id ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amountPaise / 100) : "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [subcategory, setSubcategory] = useState(existing?.subcategory ?? "");
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? "UPI");
  const [date, setDate] = useState(existing ? existing.date.slice(0, 10) : toDateInputValue());
  const [description, setDescription] = useState(existing?.description ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!existing && currentUser && !userId) setUserId(currentUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!existing && categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const isSaving = createExpense.isPending || updateExpense.isPending;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!userId) next.userId = "Please select who spent the money.";
    if (!amount || Number(amount) <= 0) next.amount = "Enter an amount greater than zero.";
    if (!categoryId) next.categoryId = "Please select a category.";
    if (!description.trim()) next.description = "Please add a short description.";
    if (!date) next.date = "Please select a date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      amount: Number(amount),
      date: new Date(date).toISOString(),
      userId,
      categoryId,
      subcategory: subcategory.trim() || null,
      description: description.trim(),
      paymentMethod: paymentMethod as Expense["paymentMethod"],
      notes: notes.trim() || null,
    };

    try {
      if (existing) {
        await updateExpense.mutateAsync({ id: existing.id, data: payload });
        toast.success("Expense updated");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Expense added");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Who spent?" required value={userId} onChange={(e) => setUserId(e.target.value)} error={errors.userId}>
        <option value="">Select person</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
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
        <Input
          label="Date"
          required
          type="date"
          value={date}
          max={toDateInputValue()}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={errors.categoryId}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          label="Payment Method"
          required
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as Expense["paymentMethod"])}
        >
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm.value} value={pm.value}>
              {pm.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Description"
        required
        placeholder="e.g. Weekly groceries"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />

      <Input
        label="Subcategory (optional)"
        placeholder="e.g. Fruits"
        value={subcategory}
        onChange={(e) => setSubcategory(e.target.value)}
      />

      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : existing ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
