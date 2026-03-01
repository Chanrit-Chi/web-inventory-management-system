import { prisma } from "@/lib/prisma";
import {
  Expense,
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseCreate,
  ExpenseUpdate,
} from "@/schemas/type-export.schema";

async function resolveCategoryId(data: {
  categoryId?: number | null;
  categoryName?: string | null;
}): Promise<number> {
  if (data.categoryId != null) {
    return data.categoryId;
  }

  const categoryName = data.categoryName?.trim();
  if (!categoryName) {
    throw new Error("Category is required");
  }

  const category = await prisma.expenseCategory.upsert({
    where: { name: categoryName },
    update: { isActive: true },
    create: { name: categoryName, isActive: true },
  });

  return category.id;
}

export const expenseDbService = {
  fetchExpenses: async (): Promise<Expense[]> => {
    return prisma.expense.findMany({
      include: {
        category: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    }) as unknown as Promise<Expense[]>;
  },

  fetchExpenseById: async (id: string): Promise<Expense | null> => {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as unknown as Promise<Expense | null>;
  },

  createExpense: async (
    data: ExpenseCreate,
    actorId?: string,
  ): Promise<Expense> => {
    const categoryId = await resolveCategoryId({
      categoryId: data.categoryId,
      categoryName: data.categoryName,
    });

    return prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        expenseDate: data.expenseDate ?? new Date(),
        categoryId,
        paymentMethodId: data.paymentMethodId ?? null,
        referenceNo: data.referenceNo ?? null,
        notes: data.notes ?? null,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null,
      },
      include: {
        category: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as unknown as Promise<Expense>;
  },

  updateExpense: async (
    id: string,
    data: ExpenseUpdate,
    actorId?: string,
  ): Promise<Expense> => {
    const updateData: {
      amount?: number;
      description?: string;
      expenseDate?: Date;
      categoryId?: number;
      paymentMethodId?: number | null;
      referenceNo?: string | null;
      notes?: string | null;
      updatedBy?: string | null;
    } = {
      updatedBy: actorId ?? null,
    };

    if (data.amount != null) updateData.amount = data.amount;
    if (data.description != null) updateData.description = data.description;
    if (data.expenseDate != null) updateData.expenseDate = data.expenseDate;
    if (Object.hasOwn(data, "paymentMethodId")) {
      updateData.paymentMethodId = data.paymentMethodId ?? null;
    }
    if (Object.hasOwn(data, "referenceNo")) {
      updateData.referenceNo = data.referenceNo ?? null;
    }
    if (Object.hasOwn(data, "notes")) {
      updateData.notes = data.notes ?? null;
    }

    if (data.categoryId != null || data.categoryName?.trim()) {
      updateData.categoryId = await resolveCategoryId({
        categoryId: data.categoryId,
        categoryName: data.categoryName,
      });
    }

    return prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as unknown as Promise<Expense>;
  },

  deleteExpense: async (id: string): Promise<Expense> => {
    return prisma.expense.delete({
      where: { id },
      include: {
        category: true,
        paymentMethod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as unknown as Promise<Expense>;
  },

  fetchCategories: async (
    includeInactive = false,
  ): Promise<ExpenseCategory[]> => {
    return prisma.expenseCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }) as unknown as Promise<ExpenseCategory[]>;
  },

  createCategory: async (
    data: ExpenseCategoryCreate,
  ): Promise<ExpenseCategory> => {
    const normalizedName = data.name.trim();

    return prisma.expenseCategory.upsert({
      where: { name: normalizedName },
      update: {
        description: data.description ?? null,
        isActive: true,
      },
      create: {
        name: normalizedName,
        description: data.description ?? null,
        isActive: data.isActive,
      },
    }) as unknown as Promise<ExpenseCategory>;
  },

  updateCategory: async (
    id: number,
    data: Pick<ExpenseCategoryCreate, "name" | "description">,
  ): Promise<ExpenseCategory> => {
    return prisma.expenseCategory.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description ?? null,
        isActive: true,
      },
    }) as unknown as Promise<ExpenseCategory>;
  },

  deleteCategory: async (id: number): Promise<ExpenseCategory> => {
    const usageCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (usageCount > 0) {
      return prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false },
      }) as unknown as Promise<ExpenseCategory>;
    }

    return prisma.expenseCategory.delete({
      where: { id },
    }) as unknown as Promise<ExpenseCategory>;
  },
} as const;
