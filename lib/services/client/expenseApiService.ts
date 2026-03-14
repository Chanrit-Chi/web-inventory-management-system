import {
  ExpenseCategoryCreateSchema,
  ExpenseCategoryUpdateSchema,
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
} from "@/schemas/expense.schema";
import {
  Expense,
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseCategoryUpdate,
  ExpenseCreate,
  ExpenseUpdate,
} from "@/schemas/type-export.schema";

export const expenseApiService = {
  AddExpense: async (expense: ExpenseCreate): Promise<Expense> => {
    const validated = ExpenseCreateSchema.parse(expense);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to add expense" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetExpenses: async (): Promise<Expense[]> => {
    const res = await fetch("/api/expenses");

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch expenses" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetExpenseById: async (id: string): Promise<Expense> => {
    const res = await fetch(`/api/expenses/${id}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Expense not found" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  UpdateExpense: async (
    id: string,
    expense: ExpenseUpdate,
  ): Promise<Expense> => {
    const validated = ExpenseUpdateSchema.parse(expense);
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...validated }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update expense" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  DeleteExpense: async (id: string): Promise<void> => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete expense" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
  },

  GetExpenseCategories: async (
    includeInactive = false,
  ): Promise<ExpenseCategory[]> => {
    const query = includeInactive ? "?includeInactive=true" : "";
    const res = await fetch(`/api/expenses/categories${query}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch expense categories" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  AddExpenseCategory: async (
    category: ExpenseCategoryCreate,
  ): Promise<ExpenseCategory> => {
    const validated = ExpenseCategoryCreateSchema.parse(category);

    const res = await fetch("/api/expenses/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create expense category" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  UpdateExpenseCategory: async (
    id: number,
    data: ExpenseCategoryUpdate,
  ): Promise<ExpenseCategory> => {
    const validated = ExpenseCategoryUpdateSchema.parse(data);
    const res = await fetch(`/api/expenses/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update expense category" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  DeleteExpenseCategory: async (id: number): Promise<ExpenseCategory> => {
    const res = await fetch(`/api/expenses/categories/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete expense category" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },
};
