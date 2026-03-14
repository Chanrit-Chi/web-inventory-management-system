import { expenseApiService } from "@/lib/services/client/expenseApiService";
import {
  ExpenseCategoryUpdate,
  ExpenseUpdate,
} from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetExpenses = () =>
  useQuery({
    queryKey: ["expenses"],
    queryFn: expenseApiService.GetExpenses,
  });

export const useGetExpenseById = (id: string) =>
  useQuery({
    queryKey: ["expense", id],
    queryFn: () => expenseApiService.GetExpenseById(id),
  });

export const useGetExpenseCategories = (includeInactive = false) =>
  useQuery({
    queryKey: ["expense-categories", { includeInactive }],
    queryFn: () => expenseApiService.GetExpenseCategories(includeInactive),
  });

export const useExpenseMutations = () => {
  const queryClient = useQueryClient();

  const addExpense = useMutation({
    mutationFn: expenseApiService.AddExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdate }) =>
      expenseApiService.UpdateExpense(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: expenseApiService.DeleteExpense,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
    },
  });

  const addExpenseCategory = useMutation({
    mutationFn: expenseApiService.AddExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });

  const updateExpenseCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseCategoryUpdate }) =>
      expenseApiService.UpdateExpenseCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });

  const deleteExpenseCategory = useMutation({
    mutationFn: expenseApiService.DeleteExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
  };
};
