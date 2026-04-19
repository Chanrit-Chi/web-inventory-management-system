export interface PaymentMethod {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const paymentMethodApiService = {
  GetPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const res = await fetch("/api/payment-methods");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  CreatePaymentMethod: async (name: string): Promise<PaymentMethod> => {
    const res = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  UpdatePaymentMethod: async (id: number, name: string): Promise<PaymentMethod> => {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  DeletePaymentMethod: async (id: number): Promise<void> => {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  },
};
