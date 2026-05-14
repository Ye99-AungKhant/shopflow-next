import { useMutation, useQuery } from "@tanstack/react-query";
import type { Payment } from "../lib/supabase";
import { createPayment, getPayments, updatePayment } from "@/lib/payment";
import { queryClient } from "@/lib/react-query";

export function useGetPayments() {
  return useQuery<Payment[], Error>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

// export function updatePaymentStatusMutation() {
//   return useMutation({
//     mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
//       updatePayment(id, { enabled }),
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: ["payments"] });
//     },
//   });
// }

export function useUpdatePaymentStatusMutation() {
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updatePayment(id, { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
