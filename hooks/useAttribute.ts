import { useQuery } from "@tanstack/react-query";
import { attributeApiService } from "@/lib/services/client/attributeApiService";

export const useGetAttributes = () =>
  useQuery({
    queryKey: ["attributes"],
    queryFn: attributeApiService.fetchAttributes,
  });
