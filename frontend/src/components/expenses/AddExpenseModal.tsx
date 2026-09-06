import { Modal } from "../ui/Modal";
import { ExpenseForm } from "./ExpenseForm";
import { useAddExpenseModal } from "../../context/AddExpenseModalContext";

export function AddExpenseModal() {
  const { isOpen, editingExpense, close } = useAddExpenseModal();

  return (
    <Modal open={isOpen} onClose={close} title={editingExpense ? "Edit Expense" : "Add Expense"}>
      {isOpen && <ExpenseForm existing={editingExpense ?? undefined} onDone={close} />}
    </Modal>
  );
}
