import { paymentMethodApiService } from "@/lib/services/client/paymentMethodApiService";
import { useQuery } from "@tanstack/react-query";

export const useGetPaymentMethods = () =>
  useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentMethodApiService.GetPaymentMethods(),
  });
