import { createContext, useContext, useState, type ReactNode } from "react";
import type { Expense } from "../types";

interface AddExpenseModalContextValue {
  isOpen: boolean;
  editingExpense: Expense | null;
  open: (editingExpense?: Expense) => void;
  close: () => void;
}

const AddExpenseModalContext = createContext<AddExpenseModalContextValue | undefined>(undefined);

export function AddExpenseModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const open = (expense?: Expense) => {
    setEditingExpense(expense ?? null);
    setIsOpen(true);
  };
  const close = () => {
    setIsOpen(false);
    setEditingExpense(null);
  };

  return (
    <AddExpenseModalContext.Provider value={{ isOpen, editingExpense, open, close }}>
      {children}
    </AddExpenseModalContext.Provider>
  );
}

export function useAddExpenseModal() {
  const ctx = useContext(AddExpenseModalContext);
  if (!ctx) throw new Error("useAddExpenseModal must be used within AddExpenseModalProvider");
  return ctx;
}
