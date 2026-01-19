export interface PaymentMethod {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const paymentMethodApiService = {
  GetPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const res = await fetch("/api/payment-methods");

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  },
};
