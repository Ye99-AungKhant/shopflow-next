import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDelivery, getDeliveries } from "../lib/delivery";
import type { Delivery } from "../lib/supabase";

export function useGetDeliveries() {
  return useQuery<Delivery[], Error>({
    queryKey: ["deliveries"],
    queryFn: getDeliveries,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}
